from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from agent_orchestrator.domain.protocols import OutboxRepository
from agent_orchestrator.models import OutboxEvent, OutboxStatus

logger = logging.getLogger(__name__)


class MongoOutboxRepository(OutboxRepository):
    """
    MongoDB implementation of OutboxRepository protocol using Beanie ODM.
    Encapsulates all database persistence operations on OutboxEvent.
    """

    async def save_event(
        self,
        event_id: str,
        aggregate_type: str,
        aggregate_id: str,
        event_type: str,
        topic: str,
        partition_key: str,
        payload: dict[str, Any],
    ) -> OutboxEvent:
        outbox_doc = OutboxEvent(
            _id=event_id,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            topic=topic,
            partition_key=partition_key,
            payload=payload,
            status=OutboxStatus.PENDING,
            created_at=datetime.now(UTC),
        )

        await outbox_doc.insert()
        return outbox_doc

    async def mark_published(self, event_id: str, published_at: datetime | None = None) -> None:
        event = await OutboxEvent.get(event_id)
        if event:
            event.status = OutboxStatus.PUBLISHED
            event.published_at = published_at or datetime.now(UTC)
            event.error_message = None
            await event.save()

    async def mark_failed(self, event_id: str, error: str, max_retries: int = 5) -> None:
        event = await OutboxEvent.get(event_id)
        if event:
            event.retry_count = (event.retry_count or 0) + 1
            if event.retry_count >= max_retries:
                event.status = OutboxStatus.FAILED
            event.error_message = str(error)
            await event.save()

    async def get_stuck_pending_events(
        self, older_than: datetime, limit: int = 50
    ) -> list[OutboxEvent]:
        return (
            await OutboxEvent.find(
                OutboxEvent.status == OutboxStatus.PENDING,
                OutboxEvent.created_at <= older_than,
            )
            .sort("+created_at")
            .limit(limit)
            .to_list()
        )

    async def get_by_id(self, event_id: str) -> OutboxEvent | None:
        return await OutboxEvent.get(event_id)
