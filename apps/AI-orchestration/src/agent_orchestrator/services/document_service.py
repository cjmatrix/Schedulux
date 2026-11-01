from __future__ import annotations

import re
import secrets

from agent_orchestrator.domain.protocols import (
    DocumentIndexingQueue,
    DocumentRepository,
    StorageService,
)
from agent_orchestrator.models import KnowledgeDocument, KnowledgeDocumentStatus
from agent_orchestrator.services.protocols import DocumentServiceProtocol


class DocumentService(DocumentServiceProtocol):
    def __init__(
        self,
        document_repo: DocumentRepository,
        storage: StorageService,
        indexing_queue: DocumentIndexingQueue | None = None,
    ):
        self.document_repo = document_repo
        self.storage = storage
        self.indexing_queue = indexing_queue

    async def get_upload_url(
        self,
        tenant_id: str,
        agent_id: str,
        file_name: str,
        file_size_bytes: int = 0,
    ) -> tuple[str, str, str, int]:
        """
        Generates presigned upload URL and creates pending KnowledgeDocument entity.
        Returns: (upload_url, document_id, s3_key, expires_in)
        """
        doc_id = f"doc_{secrets.token_urlsafe(12)}"
        clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", file_name)
        s3_key = f"tenants/{tenant_id}/agents/{agent_id}/documents/{doc_id}_{clean_name}"
        expires_in = 900  # 15 minutes

        upload_url = self.storage.generate_presigned_upload_url(
            key=s3_key,
            content_type="application/pdf",
            expires_in=expires_in,
        )

        await self.document_repo.create_document(
            tenant_id=tenant_id,
            agent_id=agent_id,
            file_name=file_name,
            file_size_bytes=file_size_bytes,
            s3_bucket=self.storage.get_bucket_name(),
            s3_key=s3_key,
            doc_id=doc_id,
        )

        return upload_url, doc_id, s3_key, expires_in

    async def confirm_upload(self, tenant_id: str, document_id: str) -> bool:
        """Mark document upload status as uploaded and dispatch background indexing job."""
        updated = await self.document_repo.update_status(
            tenant_id=tenant_id,
            document_id=document_id,
            status=KnowledgeDocumentStatus.UPLOADED,
        )
        if not updated:
            return False

        if self.indexing_queue:
            doc = await self.document_repo.get_by_doc_id(tenant_id, document_id)
            if doc:
                try:
                    await self.indexing_queue.enqueue_indexing(
                        tenant_id=tenant_id,
                        agent_id=doc.agent_id,
                        document_id=doc.doc_id,
                        s3_bucket=doc.s3_bucket,
                        s3_key=doc.s3_key,
                        file_name=doc.file_name,
                    )
                except Exception as e:
                    print(
                        f"[DocumentService Warning] Failed to enqueue background indexing job: {e}",
                        flush=True,
                    )

        return True

    async def list_documents(self, tenant_id: str, agent_id: str) -> list[KnowledgeDocument]:
        """List all documents for a tenant agent via repository."""
        return await self.document_repo.list_documents(
            tenant_id=tenant_id,
            agent_id=agent_id or None,
        )

    async def delete_document(self, tenant_id: str, document_id: str) -> bool:
        """Delete document from storage provider and repository."""
        doc = await self.document_repo.get_by_doc_id(tenant_id, document_id)
        if not doc:
            return False

        try:
            self.storage.delete_object(key=doc.s3_key, bucket=doc.s3_bucket)
        except Exception as e:
            print(f"[DocumentService] Failed to delete storage object: {e}")

        return await self.document_repo.delete_document(tenant_id, document_id)
