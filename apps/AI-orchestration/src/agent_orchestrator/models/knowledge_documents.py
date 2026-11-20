"""KnowledgeDocument — collection: knowledge_documents."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class KnowledgeDocumentStatus(StrEnum):
    PENDING = "pending"
    UPLOADED = "uploaded"
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"


"""  """


class KnowledgeDocument(Document):
    doc_id: str = Field(default_factory=lambda: f"doc_{secrets.token_urlsafe(12)}")
    tenant_id: str
    agent_id: str
    file_name: str
    file_size_bytes: int = 0
    s3_bucket: str = "my-client-pdf-uploads-mumbai"
    s3_key: str
    status: KnowledgeDocumentStatus = KnowledgeDocumentStatus.PENDING
    chunks_count: int = 0
    indexing_error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "knowledge_documents"
        indexes = [
            IndexModel([("tenant_id", 1), ("agent_id", 1)], name="idx_knowledge_doc_tenant_agent"),
            IndexModel([("doc_id", 1)], unique=True, name="idx_knowledge_doc_id"),
        ]
