from __future__ import annotations

import os

MEMORY_WINDOW_LIMIT = int(os.getenv("MEMORY_WINDOW_LIMIT", "16"))

MEMORY_TRIGGER_THRESHOLD = int(os.getenv("MEMORY_TRIGGER_THRESHOLD", "14"))


MEMORY_CHUNK_SIZE = int(os.getenv("MEMORY_CHUNK_SIZE", "8"))

MEMORY_KEEP_RECENT = int(
    os.getenv("MEMORY_KEEP_RECENT", str(MEMORY_TRIGGER_THRESHOLD - MEMORY_CHUNK_SIZE))
)


MEMORY_TRIGGER_TOKEN_THRESHOLD = int(os.getenv("MEMORY_TRIGGER_TOKEN_THRESHOLD", "3000"))
MEMORY_CHUNK_TOKEN_SIZE = int(os.getenv("MEMORY_CHUNK_TOKEN_SIZE", "1500"))


MEMORY_SUMMARIZER_MODEL = os.getenv("MEMORY_SUMMARIZER_MODEL", "gemini-3.5-flash-lite")


VOYAGE_EMBEDDING_MODEL = os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-4")
VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY", "")
VOYAGE_API_URL = os.getenv("VOYAGE_API_URL", "https://api.voyageai.com/v1/embeddings")
VOYAGE_BATCH_SIZE = int(os.getenv("VOYAGE_BATCH_SIZE", "128"))
VOYAGE_RERANK_MODEL = os.getenv("VOYAGE_RERANK_MODEL", "rerank-2-lite")

RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "4"))
RETRIEVAL_CANDIDATE_POOL_SIZE = int(os.getenv("RETRIEVAL_CANDIDATE_POOL_SIZE", "20"))


QDRANT_URL = os.getenv("QDRANT_URL", "").rstrip("/")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "agent_semantic_memory")
QDRANT_VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "1024"))


AGENT_MEMORY_QUEUE_NAME = os.getenv("AGENT_MEMORY_QUEUE_NAME", "agent-memory-queue")
AGENT_MEMORY_DLQ_NAME = os.getenv("AGENT_MEMORY_DLQ_NAME", "agent-memory-queue-dlq")
