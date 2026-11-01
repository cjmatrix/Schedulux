from __future__ import annotations

import logging
import os
from typing import Any

from agent_orchestrator.adapters.kafka_subscriber import KafkaEventSubscriber
from agent_orchestrator.adapters.rabbitmq_subscriber import RabbitMQEventSubscriber
from agent_orchestrator.domain.protocols import EventSubscriber
from agent_orchestrator.models import KnowledgeDocumentStatus
from agent_orchestrator.repositories.document_repository import MongoDocumentRepository

logger = logging.getLogger(__name__)

DOCUMENT_STATUS_QUEUE_NAME = os.getenv(
    "DOCUMENT_STATUS_QUEUE_NAME", "knowledge-document-status-queue"
)


async def handle_document_status_event(payload: dict[str, Any]) -> None:
    
    tenant_id = payload.get("tenant_id")
    document_id = payload.get("document_id")
    status_str = payload.get("status")
    chunks_count = payload.get("chunks_count")
    error_message = payload.get("error_message")

    if not tenant_id or not document_id or not status_str:
        logger.warning("[DocumentStatusHandler] Skipping invalid status message: %s", payload)
        return

    logger.info(
        "[DocumentStatusHandler] Updating doc=%s (tenant=%s) -> status=%s",
        document_id,
        tenant_id,
        status_str,
    )

    try:
        status_enum = KnowledgeDocumentStatus(status_str)
    except ValueError:
        status_enum = KnowledgeDocumentStatus.FAILED
        error_message = f"Invalid status received from worker: {status_str}"

    repo = MongoDocumentRepository()
    success = await repo.update_status(
        tenant_id=tenant_id,
        document_id=document_id,
        status=status_enum,
        chunks_count=chunks_count,
        indexing_error=error_message,
    )

    if success:
        logger.info(
            "[DocumentStatusHandler] Successfully updated MongoDB document %s to '%s'",
            document_id,
            status_enum.value,
        )
    else:
        logger.warning(
            "[DocumentStatusHandler] Document %s (tenant=%s) not found for status update",
            document_id,
            tenant_id,
        )


def create_default_document_status_subscriber() -> EventSubscriber:
 
    broker_type = os.environ.get("DOCUMENT_STATUS_EVENT_BROKER", "rabbitmq").lower()
    if broker_type == "kafka":
        return KafkaEventSubscriber(
            brokers=os.environ.get("KAFKA_BROKERS", "localhost:9092"),
            group_id=os.environ.get("KAFKA_CONSUMER_GROUP", "ai-orchestration-consumer-group"),
            username=os.environ.get("KAFKA_USERNAME", ""),
            password=os.environ.get("KAFKA_PASSWORD", ""),
        )

    return RabbitMQEventSubscriber(
        uri=os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672"),
        prefetch_count=5,
    )


async def run_document_status_consumer(subscriber: EventSubscriber | None = None) -> None:
    """
    Run document status consumer using the injected EventSubscriber port.
    Follows DIP: decouples business logic from specific message brokers.
    """
    sub = subscriber or create_default_document_status_subscriber()
    await sub.subscribe(DOCUMENT_STATUS_QUEUE_NAME, handle_document_status_event)
    await sub.start()
    logger.info(
        "[DocumentStatusConsumer] Listening for document status updates via %s on '%s'...",
        type(sub).__name__,
        DOCUMENT_STATUS_QUEUE_NAME,
    )
    await sub.run()


handle_document_status_message = handle_document_status_event
