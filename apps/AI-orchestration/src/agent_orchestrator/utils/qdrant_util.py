from __future__ import annotations

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


class QdrantVectorStore:
    def __init__(
        self,
        url: str | None = None,
        api_key: str | None = None,
        host: str = QDRANT_HOST,
        port: int = QDRANT_PORT,
        collection_name: str = QDRANT_COLLECTION_NAME,
        vector_size: int = QDRANT_VECTOR_SIZE,
    ):
        cloud_url = url or QDRANT_URL
        if cloud_url:
            self.client = AsyncQdrantClient(
                url=cloud_url.rstrip("/"),
                api_key=api_key or QDRANT_API_KEY,
            )
        else:
            self.client = AsyncQdrantClient(
                host=host,
                port=port,
                api_key=api_key or QDRANT_API_KEY,
            )

        self.collection_name = collection_name
        self.vector_size = vector_size

    async def ensure_collection(self) -> None:
        try:
            collections_resp = await self.client.get_collections()
            existing_names = [c.name for c in collections_resp.collections]

            if self.collection_name not in existing_names:
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.vector_size,
                        distance=models.Distance.COSINE,
                    ),
                )
                print(f"[Qdrant Client] Created collection: {self.collection_name}", flush=True)

            # Ensure payload indexes exist for strict mode filtering
            col_info = await self.client.get_collection(self.collection_name)
            payload_schema = col_info.payload_schema or {}
            for field in ("tenant_id", "agent_id"):
                if field not in payload_schema:
                    try:
                        await self.client.create_payload_index(
                            collection_name=self.collection_name,
                            field_name=field,
                            field_schema=models.PayloadSchemaType.KEYWORD,
                        )
                        print(
                            f"[Qdrant Client] Created index for payload field: {field}", flush=True
                        )
                    except Exception as ie:
                        print(
                            f"[Qdrant Client Warning] Index creation warning for {field}: {ie}",
                            flush=True,
                        )
        except Exception as e:
            print(f"[Qdrant Client Warning] Error in ensure_collection: {e}", flush=True)

    async def upsert_facts(
        self,
        tenant_id: str,
        agent_id: str,
        facts: list[dict[str, Any]],
        vectors: list[list[float]],
    ) -> None:
        if not facts or not vectors or len(facts) != len(vectors):
            return

        await self.ensure_collection()

        points = []
        for fact_dict, vector in zip(facts, vectors, strict=True):
            points.append(
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "tenant_id": tenant_id,
                        "agent_id": agent_id,
                        "fact": fact_dict.get("fact", ""),
                        "category": fact_dict.get("category", "general"),
                        "created_at": datetime.now(UTC).isoformat(),
                    },
                )
            )

        try:
            await self.client.upsert(
                collection_name=self.collection_name,
                points=points,
            )
            print(f"[Qdrant Client] Successfully upserted {len(points)} facts.", flush=True)
        except Exception as e:
            print(f"[Qdrant Client Warning] Failed to upsert facts: {e}", flush=True)

    async def search_relevant_facts(
        self,
        query_vector: list[float],
        tenant_id: str,
        agent_id: str | None = None,
        limit: int = 4,
    ) -> list[str]:
        if not query_vector:
            return []

        must_conditions: list[models.Condition] = [
            models.FieldCondition(
                key="tenant_id",
                match=models.MatchValue(value=tenant_id),
            )
        ]
        if agent_id:
            must_conditions.append(
                models.FieldCondition(
                    key="agent_id",
                    match=models.MatchValue(value=agent_id),
                )
            )

        try:
            results = await self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=models.Filter(must=must_conditions),
                limit=limit,
                with_payload=True,
            )
            return [p.payload["fact"] for p in results.points if p.payload and "fact" in p.payload]
        except Exception as e:
            print(f"[Qdrant Client Search Warning]: {e}", flush=True)
            return []

    async def close(self) -> None:
        if self.client:
            await self.client.close()


_default_qdrant: QdrantVectorStore | None = None


def get_qdrant_store() -> QdrantVectorStore:
    global _default_qdrant
    if _default_qdrant is None:
        _default_qdrant = QdrantVectorStore()
    return _default_qdrant
