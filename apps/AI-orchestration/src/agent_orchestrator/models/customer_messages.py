"""CustomerMessage — collection: customer_messages."""

from __future__ import annotations

from datetime import datetime

from beanie import Document
from pydantic import ConfigDict, Field
from pymongo import IndexModel


class CustomerMessage(Document):
    model_config = ConfigDict(extra="ignore")

    session_id: str
    tenant_id: str
    agent_id: str
    role: str  # "user" or "assistant"
    content: str
    token_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_messages"
        indexes = [
            IndexModel(
                [("session_id", 1), ("created_at", 1)], name="idx_customer_msg_session_time"
            ),
            IndexModel(
                [("tenant_id", 1), ("session_id", 1)], name="idx_customer_msg_tenant_session"
            ),
        ]
