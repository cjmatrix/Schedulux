from __future__ import annotations
import os
from typing import List, Optional
from voyageai import AsyncClient as VoyageAsyncClient

from agent_orchestrator.config import (
    VOYAGE_EMBEDDING_MODEL,
    VOYAGE_API_KEY,
)


class VoyageEmbeddingClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or VOYAGE_API_KEY or os.getenv("VOYAGE_API_KEY", "")
        self.model = model or VOYAGE_EMBEDDING_MODEL
        self._client: Optional[VoyageAsyncClient] = None
        if self.api_key:
            self._client = VoyageAsyncClient(api_key=self.api_key)

    @property
    def client(self) -> Optional[VoyageAsyncClient]:
        if self._client is None and self.api_key:
            self._client = VoyageAsyncClient(api_key=self.api_key)
        return self._client

    async def get_embeddings(
        self,
        texts: List[str],
        input_type: str = "document",
        truncation: bool = True,
    ) -> List[List[float]]:
        """
        Embed multiple texts in a single call using official Voyage AI SDK.
        The SDK automatically handles batching, indexing, and internal sorting.
        """
        if not texts:
            return []

        if not self.api_key or not self.client:
            print("[VoyageAI Warning] VOYAGE_API_KEY not configured. Returning zero vectors.", flush=True)
            return [[0.0] * 512 for _ in texts]

        response = await self.client.embed(
            texts=texts,
            model=self.model,
            input_type=input_type,
            truncation=truncation,
        )
        return response.embeddings

    async def embed_texts(
        self,
        texts: List[str],
        input_type: str = "document",
        truncation: bool = True,
    ) -> List[List[float]]:
        """Multi-input embedding delegating to official Voyage AI SDK."""
        return await self.get_embeddings(texts=texts, input_type=input_type, truncation=truncation)

    async def embed_query(self, query: str) -> List[float]:
        """Embed a single search query."""
        results = await self.get_embeddings([query], input_type="query")
        return results[0] if results else []


_default_client: Optional[VoyageEmbeddingClient] = None


def get_embedding_client() -> VoyageEmbeddingClient:
    global _default_client
    if _default_client is None:
        _default_client = VoyageEmbeddingClient()
    return _default_client


async def get_embeddings(texts: List[str], input_type: str = "document") -> List[List[float]]:
    client = get_embedding_client()
    return await client.get_embeddings(texts, input_type=input_type)


async def embed_texts(texts: List[str], input_type: str = "document") -> List[List[float]]:
    client = get_embedding_client()
    return await client.embed_texts(texts, input_type=input_type)


async def embed_query(query: str) -> List[float]:
    client = get_embedding_client()
    return await client.embed_query(query)
