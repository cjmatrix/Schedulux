from __future__ import annotations

from agent_orchestrator.adapters.qdrant_stores import QdrantMemoryStore


QdrantVectorStore = QdrantMemoryStore

_default_qdrant_store: QdrantMemoryStore | None = None


def get_qdrant_store() -> QdrantMemoryStore:
   
    global _default_qdrant_store
    if _default_qdrant_store is None:
        _default_qdrant_store = QdrantMemoryStore()
    return _default_qdrant_store


__all__ = ["QdrantVectorStore", "get_qdrant_store"]

