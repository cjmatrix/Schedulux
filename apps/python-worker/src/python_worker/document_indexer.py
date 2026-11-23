from __future__ import annotations

import asyncio
import os
import tempfile
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from fastembed.sparse import SparseTextEmbedding
from qdrant_client import AsyncQdrantClient, models
import voyageai

from python_worker.markdown_pdf_chunker import MarkdownPdfChunker
from python_worker.queues import publish_document_status_update
from python_worker.tracing import get_tracer

tracer = get_tracer("crawler-worker.document-indexer")

dotenv_path = Path(__file__).resolve().parents[5] / ".env"
load_dotenv(dotenv_path)

KNOWLEDGE_COLLECTION_NAME = os.getenv("KNOWLEDGE_COLLECTION_NAME", "knowledge_documents")
VOYAGE_EMBEDDING_MODEL = os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-4")
SPARSE_MODEL_NAME = os.getenv("SPARSE_EMBEDDING_MODEL", "Qdrant/bm25")
DENSE_VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "1024"))

_qdrant_client: AsyncQdrantClient | None = None
_sparse_model: SparseTextEmbedding | None = None


class PermanentIndexingError(Exception):
    """Raised when document indexing failure is permanent (e.g. corrupt PDF, password protected, empty) and cannot be fixed by retrying."""
    pass


async def async_retry_with_backoff(
    coro_fn,
    *args,
    max_retries: int = 3,
    initial_delay: float = 2.0,
    backoff_factor: float = 2.0,
    operation_name: str = "operation",
    **kwargs,
):
   
    import random
    delay = initial_delay
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            return await coro_fn(*args, **kwargs)
        except Exception as exc:
            last_exception = exc
            if isinstance(exc, PermanentIndexingError):
                raise
            if attempt == max_retries:
                print(
                    f"[{operation_name}] Exhausted all {max_retries} attempts. Final error: {exc}",
                    flush=True,
                )
                raise
            jitter = random.uniform(0.1, 0.5)
            sleep_time = delay + jitter
            print(
                f"[{operation_name}] Attempt {attempt}/{max_retries} failed ({exc}). Retrying in {sleep_time:.2f}s...",
                flush=True,
            )
            await asyncio.sleep(sleep_time)
            delay *= backoff_factor
    if last_exception:
        raise last_exception


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


def get_sparse_model() -> SparseTextEmbedding:
    """Lazy-initialise the sparse embedding model (downloads weights on first call)."""
    global _sparse_model
    if _sparse_model is None:
        _sparse_model = SparseTextEmbedding(model_name=SPARSE_MODEL_NAME)
    return _sparse_model




async def ensure_qdrant_knowledge_collection(client: AsyncQdrantClient) -> None:
    collections = await client.get_collections()
    existing = [c.name for c in collections.collections]

    if KNOWLEDGE_COLLECTION_NAME in existing:
        col_info = await client.get_collection(KNOWLEDGE_COLLECTION_NAME)
        vectors_cfg = getattr(col_info.config.params, "vectors", None)
        current_dim = None
        if isinstance(vectors_cfg, dict) and "dense-text" in vectors_cfg:
            current_dim = getattr(vectors_cfg["dense-text"], "size", None)
        elif hasattr(vectors_cfg, "size"):
            current_dim = getattr(vectors_cfg, "size", None)

        if current_dim and current_dim != DENSE_VECTOR_SIZE:
            print(
                f"[DocumentIndexer] Vector dimension mismatch for '{KNOWLEDGE_COLLECTION_NAME}': "
                f"existing is {current_dim}, expected {DENSE_VECTOR_SIZE} (model: {VOYAGE_EMBEDDING_MODEL}). "
                f"Re-creating collection with dimension {DENSE_VECTOR_SIZE}...",
                flush=True,
            )
            await client.delete_collection(KNOWLEDGE_COLLECTION_NAME)
            existing.remove(KNOWLEDGE_COLLECTION_NAME)

    if KNOWLEDGE_COLLECTION_NAME not in existing:
        await client.create_collection(
            collection_name=KNOWLEDGE_COLLECTION_NAME,
            vectors_config={
                "dense-text": models.VectorParams(
                    size=DENSE_VECTOR_SIZE,
                    distance=models.Distance.COSINE,
                ),
            },
            sparse_vectors_config={
                "sparse-text": models.SparseVectorParams(),
            },
        )
        print(
            f"[DocumentIndexer] Created Qdrant collection: {KNOWLEDGE_COLLECTION_NAME} "
            "(dense-text + sparse-text)",
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
    try:
        s3.download_file(Bucket=bucket, Key=key, Filename=dest_path)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
       
        if error_code in ("404", "NoSuchKey", "403", "AccessDenied", "InvalidBucketName"):
            raise PermanentIndexingError(
                f"Permanent S3 error downloading {key} from {bucket} ({error_code}): {e}"
            ) from e
        raise



#bm25 embdedding
def _generate_sparse_vectors(texts: list[str]) -> list[models.SparseVector]:
  
    model = get_sparse_model()
    sparse_results = list(model.embed(texts))
    return [
        models.SparseVector(
            indices=sv.indices.tolist(),
            values=sv.values.tolist(),
        )
        for sv in sparse_results
    ]


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

        async def _download_s3_async():
            await asyncio.to_thread(
                download_pdf_from_s3,
                bucket=s3_bucket,
                key=s3_key,
                dest_path=temp_pdf_path,
            )

        with tracer.start_as_current_span(
            "rag.s3.download",
            attributes={
                "s3.bucket": s3_bucket,
                "s3.key": s3_key,
                "file.name": file_name,
            },
        ):
            await async_retry_with_backoff(
                _download_s3_async,
                max_retries=3,
                initial_delay=1.5,
                backoff_factor=2.0,
                operation_name=f"S3 Download PDF ({file_name})",
            )
        print(f"[DocumentIndexer] Downloaded {file_name} from s3://{s3_bucket}/{s3_key}", flush=True)

        if not os.path.exists(temp_pdf_path) or os.path.getsize(temp_pdf_path) == 0:
            raise PermanentIndexingError(f"Downloaded file '{file_name}' from S3 is empty (0 bytes).")

        with tracer.start_as_current_span("rag.pdf.parse_and_chunk") as chunk_span:
            chunker = MarkdownPdfChunker(max_chunk_chars=2400, chunk_overlap_chars=400)
            try:
                markdown_text = chunker.parse_pdf_to_markdown(temp_pdf_path)
            except Exception as parse_err:
                raise PermanentIndexingError(
                    f"Corrupted, encrypted, or unreadable PDF '{file_name}': {parse_err}"
                ) from parse_err

            base_metadata = {
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "document_id": document_id,
                "file_name": file_name,
            }
            chunks = chunker.chunk_markdown(markdown_text, base_metadata=base_metadata)
            chunk_span.set_attribute("rag.chunks_count", len(chunks))
            print(f"[DocumentIndexer] Extracted {len(chunks)} structural chunks from {file_name}", flush=True)

        if not chunks:
            print("[DocumentIndexer Warning] No text extracted from PDF.", flush=True)
            raise PermanentIndexingError(f"Empty document / no extractable text found in '{file_name}'.")

        chunk_texts = [c.page_content for c in chunks]

        voyage_client = voyageai.AsyncClient(api_key=os.getenv("VOYAGE_API_KEY", ""))

        async def _embed_dense(texts: list[str]) -> list[list[float]]:
            batch_size = 64
            result: list[list[float]] = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]

                async def _call_embed(b=batch):
                    try:
                        resp = await voyage_client.embed(
                            texts=b,
                            model=VOYAGE_EMBEDDING_MODEL,
                            input_type="document",
                            truncation=True,
                        )
                        return resp.embeddings
                    except Exception as embed_err:
                        err_str = str(embed_err).lower()
                        err_type = type(embed_err).__name__
                        
                        is_permanent = (
                            "401" in err_str
                            or "unauthorized" in err_str
                            or "invalid api key" in err_str
                            or "400" in err_str
                            or "403" in err_str
                            or "forbidden" in err_str
                            or "AuthenticationError" in err_type
                            or "InvalidRequestError" in err_type
                        )
                        
                        if "429" in err_str or "rate limit" in err_str:
                            is_permanent = False

                        if is_permanent:
                            raise PermanentIndexingError(
                                f"Voyage AI permanent error ({err_type}): {embed_err}"
                            ) from embed_err
                        raise

                batch_embeddings = await async_retry_with_backoff(
                    _call_embed,
                    max_retries=3,
                    initial_delay=2.0,
                    backoff_factor=2.0,
                    operation_name=f"VoyageAI Embedding (batch {i // batch_size + 1})",
                )
                result.extend(batch_embeddings)
            return result

        with tracer.start_as_current_span(
            "rag.embeddings.generate",
            attributes={
                "rag.chunks_count": len(chunk_texts),
                "rag.dense_model": VOYAGE_EMBEDDING_MODEL,
                "rag.sparse_model": SPARSE_MODEL_NAME,
            },
        ):
            dense_embeddings, sparse_embeddings = await asyncio.gather(
                _embed_dense(chunk_texts),
                asyncio.to_thread(_generate_sparse_vectors, chunk_texts),
            )

        qdrant = get_qdrant_client()
        await async_retry_with_backoff(
            ensure_qdrant_knowledge_collection,
            qdrant,
            max_retries=3,
            initial_delay=1.0,
            backoff_factor=2.0,
            operation_name="Qdrant Ensure Collection",
        )

        now_iso = datetime.now(UTC).isoformat()
        points: list[models.PointStruct] = [
            models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{document_id}_{idx}")),
                vector={
                    "dense-text": dense_vec,
                    "sparse-text": sparse_vec,
                },
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
            for idx, (chunk, dense_vec, sparse_vec) in enumerate(
                zip(chunks, dense_embeddings, sparse_embeddings, strict=True)
            )
        ]

        with tracer.start_as_current_span(
            "rag.qdrant.upsert",
            attributes={
                "qdrant.collection": KNOWLEDGE_COLLECTION_NAME,
                "qdrant.points_count": len(points),
            },
        ):
            qdrant_batch_size = 100
            for i in range(0, len(points), qdrant_batch_size):
                batch_points = points[i : i + qdrant_batch_size]

                async def _upsert_batch(pts=batch_points):
                    await qdrant.upsert(
                        collection_name=KNOWLEDGE_COLLECTION_NAME,
                        points=pts,
                    )

                await async_retry_with_backoff(
                    _upsert_batch,
                    max_retries=3,
                    initial_delay=1.5,
                    backoff_factor=2.0,
                    operation_name=f"Qdrant Upsert (batch {i // qdrant_batch_size + 1})",
                )

        print(
            f"[DocumentIndexer] Successfully indexed {len(points)} chunks "
            f"(dense + sparse) for doc={document_id}",
            flush=True,
        )

        with tracer.start_as_current_span("rag.status.publish"):
            await publish_document_status_update(
                tenant_id=tenant_id,
                agent_id=agent_id,
                document_id=document_id,
                status="indexed",
                chunks_count=len(points),
            )

    except Exception as e:
        is_permanent = isinstance(e, PermanentIndexingError)
        print(
            f"[DocumentIndexer Error] Indexing failed for {document_id} (permanent={is_permanent}): {e}",
            flush=True,
        )
        await publish_document_status_update(
            tenant_id=tenant_id,
            agent_id=agent_id,
            document_id=document_id,
            status="failed",
            error_message=str(e),
        )
        raise
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.unlink(temp_pdf_path)
            except Exception:
                pass
