from __future__ import annotations

from datetime import datetime

from beanie import Document
from pydantic import ConfigDict, Field
from pymongo import IndexModel


class AgentMessage(Document):
    model_config = ConfigDict(extra="ignore")

    tenant_id: str
    agent_id: str
    seq: int = 0
    role: str  # "agent" or "tenant"
    content: str
    token_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agent_messages"
        indexes = [
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1), ("created_at", -1)],
                name="idx_tenant_agent_created_desc",
            ),
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1)],
                name="idx_tenant_agent",
            ),
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1), ("seq", 1)],
                name="idx_tenant_agent_seq",
            ),
        ]
