from __future__ import annotations

import re
import secrets

from agent_orchestrator.clients.redis_client import get_redis_client
from agent_orchestrator.config.tier_constants import get_cached_tier_config
from agent_orchestrator.domain.exceptions import TierQuotaExceededException
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
        tier: str | None = None,
    ) -> tuple[str, str, str, int]:
        redis_client = get_redis_client()
        if not tier:
            tier = await redis_client.get(f"tenant:{tenant_id}:tier")
        tier_cfg = await get_cached_tier_config(tier, redis_client)
        max_docs = tier_cfg["max_kb_docs"]

        if max_docs != -1:
            current_doc_count = await self.document_repo.count_documents(tenant_id, agent_id)
            if current_doc_count >= max_docs:
                raise TierQuotaExceededException(
                    f"Maximum document upload limit reached ({max_docs} documents per agent) for your tier ({tier_cfg['name']}). "
                    f"This agent currently has {current_doc_count} document(s). Please delete existing documents or upgrade your tier."
                )

        doc_id = f"doc_{secrets.token_urlsafe(12)}"
        clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", file_name)
        s3_key = f"tenants/{tenant_id}/agents/{agent_id}/documents/{doc_id}_{clean_name}"
        expires_in = 900  # 15 minute

        max_allowed_bytes = tier_cfg["max_kb_doc_size_mb"] * 1024 * 1024
        if file_size_bytes > 0 and file_size_bytes > max_allowed_bytes:
            max_mb = tier_cfg["max_kb_doc_size_mb"]
            raise TierQuotaExceededException(
                f"File size exceeds maximum allowed limit ({max_mb} MB) for tier {tier_cfg['name']}."
            )

        upload_url = self.storage.generate_presigned_upload_url(
            key=s3_key,
            content_type="application/pdf",
            expires_in=expires_in,
            max_allowed_bytes=max_allowed_bytes,
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
