from __future__ import annotations

from datetime import datetime

from beanie import Document
from pydantic import ConfigDict, Field
from pymongo import IndexModel


class CustomerConversation(Document):
    model_config = ConfigDict(extra="ignore")

    session_id: str
    tenant_id: str
    agent_id: str
    customer_id: str | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    status: str = "active"
    is_verified: bool = False
    verified_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_conversations"
        indexes = [
            IndexModel([("session_id", 1)], unique=True, name="idx_customer_conv_session"),
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1), ("updated_at", -1)],
                name="idx_customer_conv_tenant_agent",
            ),
            IndexModel([("tenant_id", 1), ("customer_id", 1)], name="idx_customer_conv_customer"),
        ]
