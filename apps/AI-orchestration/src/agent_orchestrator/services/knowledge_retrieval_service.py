from __future__ import annotations

import asyncio
import os
from typing import Any

import voyageai

from agent_orchestrator.config import (
    RETRIEVAL_CANDIDATE_POOL_SIZE,
    RETRIEVAL_TOP_K,
    VOYAGE_API_KEY,
    VOYAGE_RERANK_MODEL,
)
from agent_orchestrator.domain.protocols import (
    DenseEmbedder,
    KnowledgeVectorStore,
    SparseEmbedder,
)


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
        top_k: int | None = None,
        candidate_pool_size: int | None = None,
    ) -> list[dict[str, Any]]:

        if not query.strip() or not tenant_id:
            return []

        resolved_top_k = (
            top_k if top_k is not None else int(os.getenv("RETRIEVAL_TOP_K", str(RETRIEVAL_TOP_K)))
        )
        resolved_pool_size = (
            candidate_pool_size
            if candidate_pool_size is not None
            else int(os.getenv("RETRIEVAL_CANDIDATE_POOL_SIZE", str(RETRIEVAL_CANDIDATE_POOL_SIZE)))
        )

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
            limit=resolved_pool_size,
        )

        if not candidates:
            return []

        if len(candidates) <= resolved_top_k:
            return candidates

        try:
            texts = [c["content"] for c in candidates]
            rerank_resp = await self._rerank_client.rerank(
                query=query,
                documents=texts,
                model=VOYAGE_RERANK_MODEL,
                top_k=resolved_top_k,
            )
            reranked: list[dict[str, Any]] = []
            for r in rerank_resp.results:
                item = candidates[r.index].copy()
                item["relevance_score"] = round(r.relevance_score, 4)
                reranked.append(item)
            return reranked
        except Exception as e:
            print(f"[KnowledgeRetrievalService] Reranking warning: {e}", flush=True)
            return candidates[:resolved_top_k]
