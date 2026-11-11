from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from agent_orchestrator.domain.protocols import EventPublisher, OutboxRepository
from agent_orchestrator.models import OutboxEvent
from agent_orchestrator.repositories.outbox_repository import MongoOutboxRepository
from agent_orchestrator.services.protocols import OutboxServiceProtocol

logger = logging.getLogger(__name__)


class OutboxService(OutboxServiceProtocol):
    """
    Transactional Outbox Service in Layered Architecture.
    Decoupled from underlying message broker via EventPublisher protocol (DIP),
    and decoupled from MongoDB persistence via OutboxRepository protocol.
    """

    def __init__(
        self,
        repository: OutboxRepository | None = None,
        publisher: EventPublisher | None = None,
    ) -> None:
        self._repository: OutboxRepository = repository or MongoOutboxRepository()
        self._publisher = publisher

    @property
    def publisher(self) -> EventPublisher:
        if self._publisher is None:
            from agent_orchestrator.adapters.kafka_token_producer import get_event_publisher

            self._publisher = get_event_publisher()
        return self._publisher

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
        """Saves an outbox event directly via OutboxRepository with atomic single-document write."""
        return await self._repository.save_event(
            event_id=event_id,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            topic=topic,
            partition_key=partition_key,
            payload=payload,
        )

    async def publish_outbox_event(self, outbox_doc: OutboxEvent) -> None:
        try:
            await self.publisher.publish(
                topic=outbox_doc.topic,
                payload=outbox_doc.payload,
                key=outbox_doc.partition_key,
            )
            await self._repository.mark_published(outbox_doc.id)
            logger.info(
                "[Outbox] Emitted and marked PUBLISHED: %s (%s)",
                outbox_doc.id,
                outbox_doc.event_type,
            )
        except Exception as e:
            logger.error(
                "[Outbox] Immediate publish failed for %s: %s. Retrying in background recovery sweep.",
                outbox_doc.id,
                e,
            )

    def dispatch_async(self, outbox_doc: OutboxEvent) -> None:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.publish_outbox_event(outbox_doc))
        except RuntimeError:
            asyncio.create_task(self.publish_outbox_event(outbox_doc))

    async def sweep_stuck_events(self) -> None:
        try:
            grace_period = datetime.now(UTC) - timedelta(seconds=5)
            stuck_events = await self._repository.get_stuck_pending_events(
                older_than=grace_period, limit=50
            )

            if not stuck_events:
                return

            logger.info(
                "[OutboxRecovery] Found %d un-published outbox events. Retrying...",
                len(stuck_events),
            )

            for event in stuck_events:
                try:
                    await self.publisher.publish(
                        topic=event.topic,
                        payload=event.payload,
                        key=event.partition_key,
                    )
                    await self._repository.mark_published(event.id)
                    logger.info(
                        "[OutboxRecovery] Recovered and published event %s to %s",
                        event.id,
                        event.topic,
                    )
                except Exception as err:
                    await self._repository.mark_failed(event.id, str(err))
                    logger.error(
                        "[OutboxRecovery] Failed to recover event %s: %s", event.id, err
                    )
        except Exception as e:
            logger.error("[OutboxRecovery] Error in background sweep: %s", e)


_default_outbox_service: OutboxService | None = None


def get_outbox_service() -> OutboxService:
    global _default_outbox_service
    if _default_outbox_service is None:
        _default_outbox_service = OutboxService()
    return _default_outbox_service


def set_outbox_service(service: OutboxService) -> None:
    global _default_outbox_service
    _default_outbox_service = service


async def run_outbox_recovery_loop(interval_seconds: int = 10) -> None:
    """Continuous background recovery sweeper task."""
    logger.info(
        "[OutboxRecovery] Starting background recovery task (interval: %ds)...",
        interval_seconds,
    )
    service = get_outbox_service()
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await service.sweep_stuck_events()
        except asyncio.CancelledError:
            logger.info("[OutboxRecovery] Background recovery task stopped.")
            break
        except Exception as e:
            logger.error("[OutboxRecovery] Unexpected error in recovery loop: %s", e)

