from __future__ import annotations

import asyncio
import os
from typing import Any

import voyageai

from agent_orchestrator.config import VOYAGE_API_KEY
from agent_orchestrator.domain.protocols import (
    DenseEmbedder,
    KnowledgeVectorStore,
    SparseEmbedder,
)

VOYAGE_RERANK_MODEL = os.getenv("VOYAGE_RERANK_MODEL", "rerank-2-lite")


class KnowledgeRetrievalService:
    def __init__(
        self,
        dense_embedder: DenseEmbedder,
        sparse_embedder: SparseEmbedder,
        knowledge_store: KnowledgeVectorStore,
        voyage_api_key: str | None = None,
    ) -> None:
        self.dense_embedder = dense_embedder
        self.sparse_embedder = sparse_embedder
        self.knowledge_store = knowledge_store
        _key = voyage_api_key or VOYAGE_API_KEY or os.getenv("VOYAGE_API_KEY", "")
        self._rerank_client = voyageai.AsyncClient(api_key=_key)

    async def retrieve_relevant_context(
        self,
        query: str,
        tenant_id: str,
        agent_id: str | None = None,
        top_k: int = 5,
        candidate_pool_size: int = 20,
    ) -> list[dict[str, Any]]:

        if not query.strip() or not tenant_id:
            return []

        dense_vector, (sparse_indices, sparse_values) = await asyncio.gather(
            self.dense_embedder.embed_query(query),
            asyncio.to_thread(self.sparse_embedder.embed_query, query),
        )

        candidates = await self.knowledge_store.hybrid_search(
            dense_vector=dense_vector,
            sparse_indices=sparse_indices,
            sparse_values=sparse_values,
            tenant_id=tenant_id,
            agent_id=agent_id,
            limit=candidate_pool_size,
        )

        if not candidates:
            return []

        if len(candidates) <= top_k:
            return candidates

        try:
            texts = [c["content"] for c in candidates]
            rerank_resp = await self._rerank_client.rerank(
                query=query,
                documents=texts,
                model=VOYAGE_RERANK_MODEL,
                top_k=top_k,
            )
            reranked: list[dict[str, Any]] = []
            for r in rerank_resp.results:
                item = candidates[r.index].copy()
                item["relevance_score"] = round(r.relevance_score, 4)
                reranked.append(item)
            return reranked
        except Exception as e:
            print(f"[KnowledgeRetrievalService] Reranking warning: {e}", flush=True)
            return candidates[:top_k]
