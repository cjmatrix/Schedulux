from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime
from typing import Any

from qdrant_client import AsyncQdrantClient, models

from agent_orchestrator.config import (
    QDRANT_API_KEY,
    QDRANT_COLLECTION_NAME,
    QDRANT_HOST,
    QDRANT_PORT,
    QDRANT_URL,
    QDRANT_VECTOR_SIZE,
)
from agent_orchestrator.domain.protocols import KnowledgeVectorStore, MemoryVectorStore

KNOWLEDGE_COLLECTION_NAME = os.getenv("KNOWLEDGE_COLLECTION_NAME", "knowledge_documents")


def _build_qdrant_client() -> AsyncQdrantClient:
    url = QDRANT_URL or os.getenv("QDRANT_URL", "").rstrip("/")
    api_key = QDRANT_API_KEY or os.getenv("QDRANT_API_KEY", "")
    if url:
        return AsyncQdrantClient(url=url, api_key=api_key)
    return AsyncQdrantClient(
        host=os.getenv("QDRANT_HOST", QDRANT_HOST),
        port=int(os.getenv("QDRANT_PORT", str(QDRANT_PORT))),
        api_key=api_key,
    )


class QdrantMemoryStore(MemoryVectorStore):
    def __init__(
        self,
        client: AsyncQdrantClient | None = None,
        collection_name: str = QDRANT_COLLECTION_NAME,
        vector_size: int = QDRANT_VECTOR_SIZE,
    ) -> None:
        self.client = client or _build_qdrant_client()
        self.collection_name = collection_name
        self.vector_size = vector_size

    async def _ensure_collection(self) -> None:
        try:
            resp = await self.client.get_collections()
            existing = [c.name for c in resp.collections]
            if self.collection_name not in existing:
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.vector_size,
                        distance=models.Distance.COSINE,
                    ),
                )
                print(f"[QdrantMemoryStore] Created collection: {self.collection_name}", flush=True)

            col = await self.client.get_collection(self.collection_name)
            schema = col.payload_schema or {}
            for field in ("tenant_id", "agent_id"):
                if field not in schema:
                    try:
                        await self.client.create_payload_index(
                            collection_name=self.collection_name,
                            field_name=field,
                            field_schema=models.PayloadSchemaType.KEYWORD,
                        )
                    except Exception as e:
                        print(f"[QdrantMemoryStore] Index warning for {field}: {e}", flush=True)
        except Exception as e:
            print(f"[QdrantMemoryStore] ensure_collection warning: {e}", flush=True)

    async def upsert_facts(
        self,
        tenant_id: str,
        agent_id: str,
        facts: list[dict[str, Any]],
        vectors: list[list[float]],
    ) -> None:
        if not facts or not vectors or len(facts) != len(vectors):
            return
        await self._ensure_collection()
        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "tenant_id": tenant_id,
                    "agent_id": agent_id,
                    "fact": fact.get("fact", ""),
                    "category": fact.get("category", "general"),
                    "created_at": datetime.now(UTC).isoformat(),
                },
            )
            for fact, vector in zip(facts, vectors, strict=True)
        ]
        try:
            await self.client.upsert(collection_name=self.collection_name, points=points)
            print(f"[QdrantMemoryStore] Upserted {len(points)} facts.", flush=True)
        except Exception as e:
            print(f"[QdrantMemoryStore] Upsert warning: {e}", flush=True)

    async def search_relevant_facts(
        self,
        query_vector: list[float],
        tenant_id: str,
        agent_id: str | None = None,
        limit: int = 4,
    ) -> list[str]:
        if not query_vector:
            return []
        must: list[models.Condition] = [
            models.FieldCondition(key="tenant_id", match=models.MatchValue(value=tenant_id))
        ]
        if agent_id:
            must.append(
                models.FieldCondition(key="agent_id", match=models.MatchValue(value=agent_id))
            )
        try:
            results = await self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=models.Filter(must=must),
                limit=limit,
                with_payload=True,
            )
            return [p.payload["fact"] for p in results.points if p.payload and "fact" in p.payload]
        except Exception as e:
            err_msg = str(e)
            if "doesn't exist" in err_msg or "Not found" in err_msg:
                try:
                    await self._ensure_collection()
                except Exception:
                    pass
                return []
            print(f"[QdrantMemoryStore] Search warning: {e}", flush=True)
            return []

    async def close(self) -> None:
        await self.client.close()


class QdrantKnowledgeStore(KnowledgeVectorStore):
    def __init__(
        self,
        client: AsyncQdrantClient | None = None,
        collection_name: str = KNOWLEDGE_COLLECTION_NAME,
    ) -> None:
        self.client = client or _build_qdrant_client()
        self.collection_name = collection_name

    async def _collection_exists(self) -> bool:
        try:
            resp = await self.client.get_collections()
            return self.collection_name in [c.name for c in resp.collections]
        except Exception:
            return False

    async def hybrid_search(
        self,
        dense_vector: list[float],
        sparse_indices: list[int],
        sparse_values: list[float],
        tenant_id: str,
        agent_id: str | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        if not await self._collection_exists():
            return []

        must: list[models.Condition] = [
            models.FieldCondition(key="tenant_id", match=models.MatchValue(value=tenant_id))
        ]
        if agent_id:
            must.append(
                models.FieldCondition(key="agent_id", match=models.MatchValue(value=agent_id))
            )
        base_filter = models.Filter(must=must)
        sparse_vector = models.SparseVector(indices=sparse_indices, values=sparse_values)

        try:
            result = await self.client.query_points(
                collection_name=self.collection_name,
                prefetch=[
                    models.Prefetch(
                        query=dense_vector,
                        using="dense-text",
                        filter=base_filter,
                        limit=limit,
                    ),
                    models.Prefetch(
                        query=sparse_vector,
                        using="sparse-text",
                        filter=base_filter,
                        limit=limit,
                    ),
                ],
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=limit,
                with_payload=True,
            )
            chunks: list[dict[str, Any]] = []
            for point in result.points:
                if not point.payload:
                    continue
                content = point.payload.get("content", "").strip()
                if content:
                    chunks.append(
                        {
                            "chunk_id": str(point.id),
                            "content": content,
                            "file_name": point.payload.get("file_name", ""),
                            "document_id": point.payload.get("document_id", ""),
                            "is_table": point.payload.get("is_table", False),
                            "headers": point.payload.get("headers", {}),
                        }
                    )
            return chunks
        except Exception as e:
            print(f"[QdrantKnowledgeStore] Hybrid search warning: {e}", flush=True)
            return []

    async def close(self) -> None:
        await self.client.close()
