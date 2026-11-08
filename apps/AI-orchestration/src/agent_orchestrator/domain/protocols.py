from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any, Protocol, runtime_checkable

from agent_orchestrator.models import (
    AgentDraft,
    AgentMessage,
    AgentRuntimeConfig,
    KnowledgeDocument,
    KnowledgeDocumentStatus,
)


class MessageRepository(Protocol):
    async def get_messages(
        self, tenant_id: str, agent_id: str, before: datetime | None, limit: int
    ) -> tuple[list[AgentMessage], bool, str | None]: ...

    async def save_message(
        self, tenant_id: str, agent_id: str, role: str, content: str
    ) -> AgentMessage: ...

    async def count_messages(self, tenant_id: str, agent_id: str) -> int: ...

    async def get_latest_agent_message(
        self, tenant_id: str, agent_id: str
    ) -> AgentMessage | None: ...

    async def get_messages_after_seq(
        self, tenant_id: str, agent_id: str, seq: int, limit: int | None = None
    ) -> list[AgentMessage]: ...

    async def get_messages_between_seq(
        self, tenant_id: str, agent_id: str, start_seq: int, end_seq: int
    ) -> list[AgentMessage]: ...


class DraftRepository(Protocol):
    async def get_agent_draft(self, tenant_id: str, agent_id: str) -> AgentDraft | None: ...

    async def list_drafts(self, tenant_id: str) -> list[AgentDraft]: ...

    async def upsert_agent_draft(
        self,
        tenant_id: str,
        agent_id: str,
        name: str,
        creation_source: str,
        draft_dict: dict[str, Any],
    ) -> AgentDraft: ...


class RuntimeConfigRepository(Protocol):
    async def get_runtime_config(
        self, tenant_id: str, agent_id: str
    ) -> AgentRuntimeConfig | None: ...

    async def list_runtime_configs(self, tenant_id: str) -> list[AgentRuntimeConfig]: ...


@runtime_checkable
class CacheRepository(Protocol):
    async def get_cached_draft(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None: ...

    async def set_cached_draft(
        self, tenant_id: str, agent_id: str, draft: dict[str, Any], ttl: int = 86400 * 3
    ) -> None: ...

    async def delete_cached_draft(self, tenant_id: str, agent_id: str) -> None: ...

    async def get_cached_biz_context(
        self, tenant_id: str, agent_id: str
    ) -> dict[str, Any] | None: ...

    async def set_cached_biz_context(
        self, tenant_id: str, agent_id: str, context: dict[str, Any], ttl: int = 3600
    ) -> None: ...

    async def delete_cached_biz_context(self, tenant_id: str, agent_id: str) -> None: ...

    async def get_raw_crawl_draft(self, tenant_id: str) -> str | None: ...


class CrawlerQueue(Protocol):
    async def enqueue_crawl(self, tenant_id: str, url: str, job_id: str) -> None: ...

    async def get_crawl_job(self, job_id: str) -> tuple[str | None, int, list[dict[str, Any]]]: ...

    async def close(self) -> None: ...


class MemoryQueue(Protocol):
    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None: ...

    async def close(self) -> None: ...


class DocumentIndexingQueue(Protocol):
    async def enqueue_indexing(
        self,
        tenant_id: str,
        agent_id: str,
        document_id: str,
        s3_bucket: str,
        s3_key: str,
        file_name: str,
    ) -> None: ...

    async def close(self) -> None: ...


class AgentOrchestrator(Protocol):
    async def start_session(
        self, tenant_id: str, initial_draft: dict[str, Any], agent_id: str
    ) -> dict[str, Any]: ...

    async def resume_session(
        self, tenant_id: str, user_answer: str, agent_id: str
    ) -> dict[str, Any]: ...

    async def get_current_draft(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None: ...


class StorageService(Protocol):
    """Abstract cloud object storage provider (AWS S3, Cloudflare R2, MinIO, GCS)."""

    def generate_presigned_upload_url(
        self, key: str, content_type: str = "application/pdf", expires_in: int = 900
    ) -> str: ...

    def delete_object(self, key: str, bucket: str | None = None) -> None: ...

    def get_bucket_name(self) -> str: ...


class DocumentRepository(Protocol):
    """Abstract persistence for KnowledgeDocument entities."""

    async def create_document(
        self,
        tenant_id: str,
        agent_id: str,
        file_name: str,
        file_size_bytes: int,
        s3_bucket: str,
        s3_key: str,
        doc_id: str | None = None,
    ) -> KnowledgeDocument: ...

    async def get_by_doc_id(self, tenant_id: str, document_id: str) -> KnowledgeDocument | None: ...

    async def update_status(
        self,
        tenant_id: str,
        document_id: str,
        status: KnowledgeDocumentStatus,
        chunks_count: int | None = None,
        indexing_error: str | None = None,
    ) -> bool: ...

    async def list_documents(
        self, tenant_id: str, agent_id: str | None = None
    ) -> list[KnowledgeDocument]: ...

    async def delete_document(self, tenant_id: str, document_id: str) -> bool: ...


MessageHandler = Callable[[dict[str, Any]], Awaitable[None]]


class EventSubscriber(Protocol):
    async def subscribe(self, topic_or_queue: str, handler: MessageHandler) -> None: ...

    async def start(self) -> None: ...

    async def run(self) -> None: ...

    async def stop(self) -> None: ...


class DenseEmbedder(Protocol):
    async def embed_texts(
        self, texts: list[str], input_type: str = "document"
    ) -> list[list[float]]: ...

    async def embed_query(self, query: str) -> list[float]: ...


class SparseEmbedder(Protocol):
    def embed_texts(self, texts: list[str]) -> list[tuple[list[int], list[float]]]: ...

    def embed_query(self, query: str) -> tuple[list[int], list[float]]: ...


class MemoryVectorStore(Protocol):
    async def upsert_facts(
        self,
        tenant_id: str,
        agent_id: str,
        facts: list[dict[str, Any]],
        vectors: list[list[float]],
    ) -> None: ...

    async def search_relevant_facts(
        self,
        query_vector: list[float],
        tenant_id: str,
        agent_id: str | None,
        limit: int,
    ) -> list[str]: ...


class KnowledgeVectorStore(Protocol):
    async def hybrid_search(
        self,
        dense_vector: list[float],
        sparse_indices: list[int],
        sparse_values: list[float],
        tenant_id: str,
        agent_id: str | None,
        limit: int,
    ) -> list[dict[str, Any]]: ...
