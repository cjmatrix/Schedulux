from __future__ import annotations
import uuid
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from agent_orchestrator.config import (
    QDRANT_URL,
    QDRANT_API_KEY,
    QDRANT_HOST,
    QDRANT_PORT,
    QDRANT_COLLECTION_NAME,
    QDRANT_VECTOR_SIZE,
)


class QdrantVectorStore:
    def __init__(
        self,
        url: Optional[str] = None,
        api_key: Optional[str] = None,
        host: str = QDRANT_HOST,
        port: int = QDRANT_PORT,
        collection_name: str = QDRANT_COLLECTION_NAME,
        vector_size: int = QDRANT_VECTOR_SIZE,
    ):
        cloud_url = url or QDRANT_URL
        if cloud_url:
            self.base_url = cloud_url.rstrip("/")
        else:
            self.base_url = f"http://{host}:{port}"

        self.api_key = api_key or QDRANT_API_KEY
        self.collection_name = collection_name
        self.vector_size = vector_size

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["api-key"] = self.api_key
        return headers

    async def ensure_collection(self) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.base_url}/collections/{self.collection_name}",
                headers=self._get_headers(),
            )
            if resp.status_code == 200:
                return

            payload = {
                "vectors": {
                    "size": self.vector_size,
                    "distance": "Cosine",
                }
            }
            create_resp = await client.put(
                f"{self.base_url}/collections/{self.collection_name}",
                headers=self._get_headers(),
                json=payload,
            )
            if create_resp.status_code not in (200, 201):
                print(f"[Qdrant Cloud Warning] Failed to create collection {self.collection_name}: {create_resp.text}", flush=True)

    async def upsert_facts(
        self,
        tenant_id: str,
        agent_id: str,
        facts: List[Dict[str, Any]],
        vectors: List[List[float]],
    ) -> None:
        if not facts or not vectors or len(facts) != len(vectors):
            return

        await self.ensure_collection()

        points = []
        for fact_dict, vector in zip(facts, vectors):
            point_id = str(uuid.uuid4())
            points.append({
                "id": point_id,
                "vector": vector,
                "payload": {
                    "tenant_id": tenant_id,
                    "agent_id": agent_id,
                    "fact": fact_dict.get("fact", ""),
                    "category": fact_dict.get("category", "general"),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            })

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.put(
                f"{self.base_url}/collections/{self.collection_name}/points",
                headers=self._get_headers(),
                json={"points": points},
            )
            if resp.status_code not in (200, 201):
                print(f"[Qdrant Warning] Failed to upsert facts: {resp.text}", flush=True)

    async def search_relevant_facts(
        self,
        query_vector: List[float],
        tenant_id: str,
        agent_id: Optional[str] = None,
        limit: int = 4,
    ) -> List[str]:
        if not query_vector:
            return []

        must_filters = [{"key": "tenant_id", "match": {"value": tenant_id}}]
        if agent_id:
            must_filters.append({"key": "agent_id", "match": {"value": agent_id}})

        payload = {
            "vector": query_vector,
            "filter": {"must": must_filters},
            "limit": limit,
            "with_payload": True,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/collections/{self.collection_name}/points/search",
                    headers=self._get_headers(),
                    json=payload,
                )
                if resp.status_code != 200:
                    return []

                results = resp.json().get("result", [])
                return [
                    r["payload"]["fact"]
                    for r in results
                    if r.get("payload") and "fact" in r["payload"]
                ]
        except Exception as e:
            print(f"[Qdrant Search Warning]: {e}", flush=True)
            return []


_default_qdrant: Optional[QdrantVectorStore] = None


def get_qdrant_store() -> QdrantVectorStore:
    global _default_qdrant
    if _default_qdrant is None:
        _default_qdrant = QdrantVectorStore()
    return _default_qdrant
