from __future__ import annotations

import os

from voyageai import AsyncClient as VoyageAsyncClient

from agent_orchestrator.config import VOYAGE_API_KEY, VOYAGE_EMBEDDING_MODEL
from agent_orchestrator.domain.protocols import DenseEmbedder


class VoyageDenseEmbedder(DenseEmbedder):
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        self._api_key = api_key or VOYAGE_API_KEY or os.getenv("VOYAGE_API_KEY", "")
        self._model = model or VOYAGE_EMBEDDING_MODEL
        self._client: VoyageAsyncClient | None = None
        if self._api_key:
            self._client = VoyageAsyncClient(api_key=self._api_key)

    @property
    def client(self) -> VoyageAsyncClient | None:
        if self._client is None and self._api_key:
            self._client = VoyageAsyncClient(api_key=self._api_key)
        return self._client

    async def embed_texts(
        self, texts: list[str], input_type: str = "document"
    ) -> list[list[float]]:
        if not texts:
            return []
        if not self.client:
            print(
                "[VoyageDenseEmbedder] VOYAGE_API_KEY not set — returning zero vectors.", flush=True
            )
            return [[0.0] * 512 for _ in texts]

        response = await self.client.embed(
            texts=texts,
            model=self._model,
            input_type=input_type,
            truncation=True,
        )
        return [list(v) for v in response.embeddings]

    async def embed_query(self, query: str) -> list[float]:
        results = await self.embed_texts([query], input_type="query")
        return results[0] if results else []
