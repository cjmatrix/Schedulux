from __future__ import annotations

import os
from typing import Any

import voyageai
from qdrant_client import AsyncQdrantClient, models

from agent_orchestrator.config import (
    QDRANT_API_KEY,
    QDRANT_HOST,
    QDRANT_PORT,
    QDRANT_URL,
    VOYAGE_API_KEY,
    VOYAGE_EMBEDDING_MODEL,
)

KNOWLEDGE_COLLECTION_NAME = os.getenv("KNOWLEDGE_COLLECTION_NAME", "knowledge_documents")
VOYAGE_RERANK_MODEL = os.getenv("VOYAGE_RERANK_MODEL", "rerank-2-lite")


class KnowledgeRetrievalService:
    """
    Hybrid RAG Retrieval Service:
    1. Dense Vector Search via Voyage AI embeddings + Qdrant (top 20).
    2. BM25 / Keyword Search via Qdrant full-text index (top 20).
    3. Deduplication of candidates.
    4. Two-Stage Reranking via Voyage AI Reranker (rerank-2-lite) -> top K.
    """

    def __init__(
        self,
        qdrant_client: AsyncQdrantClient | None = None,
        voyage_api_key: str | None = None,
    ):
        self.voyage_api_key = voyage_api_key or VOYAGE_API_KEY or os.getenv("VOYAGE_API_KEY", "")
        self.voyage_client = voyageai.AsyncClient(api_key=self.voyage_api_key)

        if qdrant_client:
            self.qdrant = qdrant_client
        else:
            url = QDRANT_URL or os.getenv("QDRANT_URL", "").rstrip("/")
            api_key = QDRANT_API_KEY or os.getenv("QDRANT_API_KEY", "")
            if url:
                self.qdrant = AsyncQdrantClient(url=url, api_key=api_key)
            else:
                host = os.getenv("QDRANT_HOST", QDRANT_HOST)
                port = int(os.getenv("QDRANT_PORT", str(QDRANT_PORT)))
                self.qdrant = AsyncQdrantClient(host=host, port=port)

    async def retrieve_relevant_context(
        self,
        query: str,
        tenant_id: str,
        agent_id: str | None = None,
        top_k: int = 5,
        candidate_pool_size: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Executes hybrid search (dense + BM25 keyword) and reranks with Voyage AI.
        Returns list of chunks with content, score, and source metadata.
        """
        if not query.strip() or not tenant_id:
            return []

        try:
            collections_resp = await self.qdrant.get_collections()
            collection_names = [c.name for c in collections_resp.collections]
            if KNOWLEDGE_COLLECTION_NAME not in collection_names:
                return []
        except Exception:
            return []

        # 1. Base filter conditions for strict multi-tenant isolation
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

        base_filter = models.Filter(must=must_conditions)

        # 2. Phase 1A: Dense Vector Retrieval via Voyage AI
        dense_candidates: list[models.ScoredPoint] = []
        try:
            embed_resp = await self.voyage_client.embed(
                texts=[query],
                model=VOYAGE_EMBEDDING_MODEL,
                input_type="query",
            )
            query_vector: list[float] = [float(x) for x in embed_resp.embeddings[0]]

            dense_res = await self.qdrant.query_points(
                collection_name=KNOWLEDGE_COLLECTION_NAME,
                query=query_vector,
                query_filter=base_filter,
                limit=candidate_pool_size,
                with_payload=True,
            )
            dense_candidates = dense_res.points
        except Exception as e:
            print(f"[KnowledgeRetrieval] Dense vector retrieval warning: {e}", flush=True)

        # 3. Phase 1B: Sparse / BM25 Keyword Search via Qdrant full-text
        sparse_candidates: list[models.Record] = []
        try:
            keyword_conditions = list(must_conditions)
            keyword_conditions.append(
                models.FieldCondition(
                    key="content",
                    match=models.MatchText(text=query),
                )
            )
            keyword_filter = models.Filter(must=keyword_conditions)

            sparse_res = await self.qdrant.scroll(
                collection_name=KNOWLEDGE_COLLECTION_NAME,
                scroll_filter=keyword_filter,
                limit=candidate_pool_size,
                with_payload=True,
            )
            sparse_candidates = sparse_res[0]
        except Exception as e:
            print(f"[KnowledgeRetrieval] BM25 keyword retrieval warning: {e}", flush=True)

        # 4. Merge & Deduplicate Candidate Chunks
        all_candidate_points: list[models.ScoredPoint | models.Record] = [
            *dense_candidates,
            *sparse_candidates,
        ]
        unique_chunks: dict[str, dict[str, Any]] = {}
        for point in all_candidate_points:
            p_id = str(point.id)
            if p_id not in unique_chunks and point.payload:
                content = point.payload.get("content", "").strip()
                if content:
                    unique_chunks[p_id] = {
                        "chunk_id": p_id,
                        "content": content,
                        "file_name": point.payload.get("file_name", ""),
                        "document_id": point.payload.get("document_id", ""),
                        "is_table": point.payload.get("is_table", False),
                        "headers": point.payload.get("headers", {}),
                    }

        candidate_list = list(unique_chunks.values())
        if not candidate_list:
            return []

        # If candidates are few or equal to top_k, return immediately
        if len(candidate_list) <= top_k:
            return candidate_list

        # 5. Phase 2: Voyage AI Cross-Encoder Reranking
        try:
            candidate_texts = [c["content"] for c in candidate_list]
            rerank_resp = await self.voyage_client.rerank(
                query=query,
                documents=candidate_texts,
                model=VOYAGE_RERANK_MODEL,
                top_k=top_k,
            )

            reranked_results: list[dict[str, Any]] = []
            for r in rerank_resp.results:
                matched_candidate = candidate_list[r.index].copy()
                matched_candidate["relevance_score"] = round(r.relevance_score, 4)
                reranked_results.append(matched_candidate)

            return reranked_results

        except Exception as e:
            print(f"[KnowledgeRetrieval] Voyage AI reranking warning: {e}", flush=True)
            # Fallback to returning top_k un-reranked candidates
            return candidate_list[:top_k]
