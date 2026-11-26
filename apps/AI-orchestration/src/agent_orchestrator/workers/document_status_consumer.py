from __future__ import annotations

import logging
import os
from typing import Any

from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

from agent_orchestrator.domain.protocols import DocumentRepository, EventSubscriber
from agent_orchestrator.models import KnowledgeDocumentStatus
from agent_orchestrator.repositories.document_repository import MongoDocumentRepository

logger = logging.getLogger(__name__)
tracer = trace.get_tracer("agent-orchestrator.document-status-consumer")

DOCUMENT_STATUS_QUEUE_NAME = os.getenv(
    "DOCUMENT_STATUS_QUEUE_NAME", "knowledge-document-status-queue"
)


class DocumentStatusConsumer:
    def __init__(
        self,
        subscriber: EventSubscriber,
        document_repo: DocumentRepository | None = None,
        queue_name: str = DOCUMENT_STATUS_QUEUE_NAME,
    ) -> None:
        self.subscriber = subscriber
        self.document_repo = document_repo or MongoDocumentRepository()
        self.queue_name = queue_name

    async def handle_status_event(self, payload: dict[str, Any]) -> None:
        tenant_id = payload.get("tenant_id")
        document_id = payload.get("document_id")
        status_str = payload.get("status")
        chunks_count = payload.get("chunks_count")
        error_message = payload.get("error_message")
        traceparent = payload.get("traceparent")

        parent_ctx = None
        if traceparent:
            parent_ctx = TraceContextTextMapPropagator().extract({"traceparent": traceparent})

        with tracer.start_as_current_span(
            "knowledge.document.status_update",
            context=parent_ctx,
            kind=trace.SpanKind.CONSUMER,
            attributes={
                "messaging.system": "aws_sqs",
                "messaging.destination.name": self.queue_name,
                "messaging.operation": "process",
                "tenant.id": tenant_id or "",
                "document.id": document_id or "",
                "document.status": status_str or "",
            },
        ):
            if not tenant_id or not document_id or not status_str:
                logger.warning("[DocumentStatusConsumer] Skipping invalid status message: %s", payload)
                return

            logger.info(
                "[DocumentStatusConsumer] Updating doc=%s (tenant=%s) -> status=%s",
                document_id,
                tenant_id,
                status_str,
            )

            try:
                status_enum = KnowledgeDocumentStatus(status_str)
            except ValueError:
                status_enum = KnowledgeDocumentStatus.FAILED
                error_message = f"Invalid status received from worker: {status_str}"

            success = await self.document_repo.update_status(
                tenant_id=tenant_id,
                document_id=document_id,
                status=status_enum,
                chunks_count=chunks_count,
                indexing_error=error_message,
            )

            if success:
                logger.info(
                    "[DocumentStatusConsumer] Successfully updated MongoDB document %s to '%s'",
                    document_id,
                    status_enum.value,
                )
            else:
                logger.warning(
                    "[DocumentStatusConsumer] Document %s (tenant=%s) not found for status update",
                    document_id,
                    tenant_id,
                )

    async def start(self) -> None:
        await self.subscriber.subscribe(self.queue_name, self.handle_status_event)
        await self.subscriber.start()
        logger.info(
            "[DocumentStatusConsumer] Listening for document status updates via %s on '%s'...",
            type(self.subscriber).__name__,
            self.queue_name,
        )
        await self.subscriber.run()

    async def stop(self) -> None:
        """Stop the underlying subscriber."""
        await self.subscriber.stop()
