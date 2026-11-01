from __future__ import annotations

import os

from fastembed.sparse import SparseTextEmbedding

from agent_orchestrator.domain.protocols import SparseEmbedder

SPARSE_MODEL_NAME = os.getenv("SPARSE_EMBEDDING_MODEL", "Qdrant/bm25")

_model: SparseTextEmbedding | None = None


def _get_model() -> SparseTextEmbedding:
    global _model
    if _model is None:
        _model = SparseTextEmbedding(model_name=SPARSE_MODEL_NAME)
    return _model


class BM25SparseEmbedder(SparseEmbedder):
    def embed_texts(self, texts: list[str]) -> list[tuple[list[int], list[float]]]:
        model = _get_model()
        return [(sv.indices.tolist(), sv.values.tolist()) for sv in model.embed(texts)]

    def embed_query(self, query: str) -> tuple[list[int], list[float]]:
        model = _get_model()
        result = next(iter(model.embed([query])))
        return result.indices.tolist(), result.values.tolist()
