from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class OutboxStatus(StrEnum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"


class OutboxEvent(Document):
    id: str = Field(alias="_id")
    aggregate_type: str = "token_usage"
    aggregate_id: str
    event_type: str = "billing.tokens.consumed"
    topic: str = "billing.tokens.consumed"
    partition_key: str
    payload: dict[str, Any]
    status: OutboxStatus = OutboxStatus.PENDING
    retry_count: int = 0
    error_message: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    published_at: datetime | None = None

    class Settings:
        name = "outbox_events"
        indexes = [
            IndexModel([("status", 1), ("created_at", 1)], name="idx_outbox_status_created"),
            IndexModel(
                [("published_at", 1)],
                expireAfterSeconds=604800,
                partialFilterExpression={"status": "PUBLISHED"},
                name="idx_outbox_published_ttl",
            ),
        ]
