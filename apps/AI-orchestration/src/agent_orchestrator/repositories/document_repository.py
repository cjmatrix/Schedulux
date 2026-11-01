from __future__ import annotations

import secrets
from datetime import UTC, datetime

from agent_orchestrator.domain.protocols import DocumentRepository
from agent_orchestrator.models import KnowledgeDocument, KnowledgeDocumentStatus


class MongoDocumentRepository(DocumentRepository):
    """
    MongoDB implementation of DocumentRepository protocol using Beanie ODM.
    Encapsulates all database persistence operations on KnowledgeDocument.
    """

    async def create_document(
        self,
        tenant_id: str,
        agent_id: str,
        file_name: str,
        file_size_bytes: int,
        s3_bucket: str,
        s3_key: str,
        doc_id: str | None = None,
    ) -> KnowledgeDocument:
        assigned_id = doc_id or f"doc_{secrets.token_urlsafe(12)}"
        doc = KnowledgeDocument(
            doc_id=assigned_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            file_name=file_name,
            file_size_bytes=file_size_bytes,
            s3_bucket=s3_bucket,
            s3_key=s3_key,
            status=KnowledgeDocumentStatus.PENDING,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        await doc.insert()
        return doc

    async def get_by_doc_id(self, tenant_id: str, document_id: str) -> KnowledgeDocument | None:
        return await KnowledgeDocument.find_one(
            KnowledgeDocument.doc_id == document_id,
            KnowledgeDocument.tenant_id == tenant_id,
        )

    async def update_status(
        self,
        tenant_id: str,
        document_id: str,
        status: KnowledgeDocumentStatus,
        chunks_count: int | None = None,
        indexing_error: str | None = None,
    ) -> bool:
        doc = await self.get_by_doc_id(tenant_id, document_id)
        if not doc:
            return False
        doc.status = status
        if chunks_count is not None:
            doc.chunks_count = chunks_count
        if indexing_error is not None:
            doc.indexing_error = indexing_error
        doc.updated_at = datetime.now(UTC)
        await doc.save()
        return True

    async def list_documents(
        self, tenant_id: str, agent_id: str | None = None
    ) -> list[KnowledgeDocument]:
        query = [KnowledgeDocument.tenant_id == tenant_id]
        if agent_id:
            query.append(KnowledgeDocument.agent_id == agent_id)

        docs = await KnowledgeDocument.find(*query).sort("-created_at").to_list()
        return docs

    async def delete_document(self, tenant_id: str, document_id: str) -> bool:
        doc = await self.get_by_doc_id(tenant_id, document_id)
        if not doc:
            return False
        await doc.delete()
        return True
