from __future__ import annotations

import os
import tempfile
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient, models
import voyageai

from python_worker.markdown_pdf_chunker import MarkdownPdfChunker
from python_worker.queues import publish_document_status_update

dotenv_path = Path(__file__).resolve().parents[5] / ".env"
load_dotenv(dotenv_path)

KNOWLEDGE_COLLECTION_NAME = os.getenv("KNOWLEDGE_COLLECTION_NAME", "knowledge_documents")
VOYAGE_EMBEDDING_MODEL = os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-3-lite")
VECTOR_SIZE = 512

_qdrant_client: AsyncQdrantClient | None = None


def get_qdrant_client() -> AsyncQdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        url = os.getenv("QDRANT_URL", "").rstrip("/")
        api_key = os.getenv("QDRANT_API_KEY", "")
        if url:
            _qdrant_client = AsyncQdrantClient(url=url, api_key=api_key)
        else:
            host = os.getenv("QDRANT_HOST", "localhost")
            port = int(os.getenv("QDRANT_PORT", "6333"))
            _qdrant_client = AsyncQdrantClient(host=host, port=port)
    return _qdrant_client


async def ensure_qdrant_knowledge_collection(client: AsyncQdrantClient) -> None:

    try:
        collections = await client.get_collections()
        existing = [c.name for c in collections.collections]

        if KNOWLEDGE_COLLECTION_NAME not in existing:
            await client.create_collection(
                collection_name=KNOWLEDGE_COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=VECTOR_SIZE,
                    distance=models.Distance.COSINE,
                ),
            )
            print(
                f"[DocumentIndexer] Created Qdrant collection: {KNOWLEDGE_COLLECTION_NAME}",
                flush=True,
            )

        col_info = await client.get_collection(KNOWLEDGE_COLLECTION_NAME)
        payload_schema = col_info.payload_schema or {}

     
        for field in ("tenant_id", "agent_id", "document_id"):
            if field not in payload_schema:
                try:
                    await client.create_payload_index(
                        collection_name=KNOWLEDGE_COLLECTION_NAME,
                        field_name=field,
                        field_schema=models.PayloadSchemaType.KEYWORD,
                    )
                except Exception as e:
                    print(f"[DocumentIndexer] Warning creating index for {field}: {e}", flush=True)

        
        if "content" not in payload_schema:
            try:
                await client.create_payload_index(
                    collection_name=KNOWLEDGE_COLLECTION_NAME,
                    field_name="content",
                    field_schema=models.TextIndexParams(
                        type=models.TextIndexType.TEXT,
                        tokenizer=models.TokenizerType.WORD,
                        lowercase=True,
                    ),
                )
                print("[DocumentIndexer] Created full-text BM25 index on 'content'", flush=True)
            except Exception as e:
                print(f"[DocumentIndexer] Warning creating full-text index on content: {e}", flush=True)

    except Exception as e:
        print(f"[DocumentIndexer] Error in ensure_qdrant_knowledge_collection: {e}", flush=True)


def download_pdf_from_s3(bucket: str, key: str, dest_path: str) -> None:
    region = os.getenv("AWS_REGION", "ap-south-1").strip()
    client_kwargs: dict[str, Any] = {
        "service_name": "s3",
        "region_name": region,
        "endpoint_url": f"https://s3.{region}.amazonaws.com",
        "config": Config(
            signature_version="s3v4",
            s3={"addressing_style": "virtual"},
        ),
    }
    aws_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    if aws_key and aws_secret:
        client_kwargs["aws_access_key_id"] = aws_key.strip()
        client_kwargs["aws_secret_access_key"] = aws_secret.strip()

    s3 = boto3.client(**client_kwargs)
    s3.download_file(Bucket=bucket, Key=key, Filename=dest_path)


async def process_document_indexing(data: dict[str, Any]) -> None:

    tenant_id = data.get("tenant_id")
    agent_id = data.get("agent_id") or ""
    document_id = data.get("document_id")
    s3_bucket = data.get("s3_bucket") or os.getenv("AWS_S3_BUCKET", "my-client-pdf-uploads-mumbai").strip()
    s3_key = data.get("s3_key")
    file_name = data.get("file_name", "document.pdf")

    if not tenant_id or not document_id or not s3_key:
        print(f"[DocumentIndexer Error] Missing required fields in job payload: {data}", flush=True)
        return

    print(
        f"[DocumentIndexer] Starting indexing for doc={document_id}, tenant={tenant_id}, file={file_name}",
        flush=True,
    )
    await publish_document_status_update(
        tenant_id=tenant_id,
        agent_id=agent_id,
        document_id=document_id,
        status="indexing",
    )

    temp_pdf_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
            temp_pdf_path = tf.name

        download_pdf_from_s3(bucket=s3_bucket, key=s3_key, dest_path=temp_pdf_path)
        print(f"[DocumentIndexer] Downloaded {file_name} from s3://{s3_bucket}/{s3_key}", flush=True)

        chunker = MarkdownPdfChunker(max_chunk_chars=2400, chunk_overlap_chars=400)
        markdown_text = chunker.parse_pdf_to_markdown(temp_pdf_path)

        base_metadata = {
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "document_id": document_id,
            "file_name": file_name,
        }
        chunks = chunker.chunk_markdown(markdown_text, base_metadata=base_metadata)
        print(f"[DocumentIndexer] Extracted {len(chunks)} structural chunks from {file_name}", flush=True)

        if not chunks:
            print("[DocumentIndexer Warning] No text extracted from PDF.", flush=True)
            await publish_document_status_update(
                tenant_id=tenant_id,
                agent_id=agent_id,
                document_id=document_id,
                status="failed",
                error_message="Empty document / no text",
            )
            return

        voyage_api_key = os.getenv("VOYAGE_API_KEY", "")
        voyage_client = voyageai.AsyncClient(api_key=voyage_api_key)

        chunk_texts = [c.page_content for c in chunks]
        batch_size = 64
        all_embeddings: list[list[float]] = []

        for i in range(0, len(chunk_texts), batch_size):
            batch = chunk_texts[i : i + batch_size]
            resp = await voyage_client.embed(
                texts=batch,
                model=VOYAGE_EMBEDDING_MODEL,
                input_type="document",
                truncation=True,
            )
            all_embeddings.extend(resp.embeddings)

        qdrant = get_qdrant_client()
        await ensure_qdrant_knowledge_collection(qdrant)

        now_iso = datetime.now(UTC).isoformat()
        points: list[models.PointStruct] = [
            models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{document_id}_{idx}")),
                vector=vector,
                payload={
                    "tenant_id": tenant_id,
                    "agent_id": agent_id,
                    "document_id": document_id,
                    "file_name": file_name,
                    "chunk_index": idx,
                    "content": chunk.page_content,
                    "headers": chunk.metadata,
                    "is_table": chunk.metadata.get("is_table", False),
                    "created_at": now_iso,
                },
            )
            for idx, (chunk, vector) in enumerate(zip(chunks, all_embeddings, strict=True))
        ]

        qdrant_batch_size = 100
        for i in range(0, len(points), qdrant_batch_size):
            p_batch = points[i : i + qdrant_batch_size]
            await qdrant.upsert(
                collection_name=KNOWLEDGE_COLLECTION_NAME,
                points=p_batch,
            )

        print(
            f"[DocumentIndexer] Successfully indexed {len(points)} chunks into Qdrant for doc={document_id}",
            flush=True,
        )

        await publish_document_status_update(
            tenant_id=tenant_id,
            agent_id=agent_id,
            document_id=document_id,
            status="indexed",
            chunks_count=len(points),
        )

    except Exception as e:
        print(f"[DocumentIndexer Error] Indexing failed for {document_id}: {e}", flush=True)
        await publish_document_status_update(
            tenant_id=tenant_id,
            agent_id=agent_id,
            document_id=document_id,
            status="failed",
            error_message=str(e),
        )
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.unlink(temp_pdf_path)
            except Exception:
                pass
