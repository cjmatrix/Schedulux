from __future__ import annotations

from datetime import datetime
from typing import Any

from agent_orchestrator.domain.protocols import MessageRepository
from agent_orchestrator.models import AgentMessage

_encoder: Any = None
try:
    import tiktoken

    _encoder = tiktoken.get_encoding("cl100k_base")
except Exception:
    _encoder = None


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    if _encoder:
        try:
            return max(1, len(_encoder.encode(text)))
        except Exception:
            pass
    return max(1, len(text) // 4)


class MongoMessageRepository(MessageRepository):
    async def get_messages(
        self, tenant_id: str, agent_id: str, before: datetime | None, limit: int
    ) -> tuple[list[AgentMessage], bool, str | None]:
        query: dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}
        if before:
            query["created_at"] = {"$lt": before}

        messages = await AgentMessage.find(query).sort("-created_at").limit(limit + 1).to_list()
        has_more = len(messages) > limit
        slice_msgs = messages[:limit]

        next_cursor = slice_msgs[-1].created_at.isoformat() if slice_msgs and has_more else None

        return list(reversed(slice_msgs)), has_more, next_cursor

    async def save_message(
        self, tenant_id: str, agent_id: str, role: str, content: str
    ) -> AgentMessage:
        latest = (
            await AgentMessage.find({"tenant_id": tenant_id, "agent_id": agent_id})
            .sort("-seq")
            .first_or_none()
        )
        if latest and latest.seq:
            next_seq = latest.seq + 1
        else:
            next_seq = await self.count_messages(tenant_id, agent_id) + 1

        token_count = estimate_tokens(content)
        msg = AgentMessage(
            tenant_id=tenant_id,
            agent_id=agent_id,
            seq=next_seq,
            role=role,
            content=content,
            token_count=token_count,
        )
        await msg.insert()
        return msg

    async def count_messages(self, tenant_id: str, agent_id: str) -> int:
        return await AgentMessage.find({"tenant_id": tenant_id, "agent_id": agent_id}).count()

    async def get_latest_agent_message(self, tenant_id: str, agent_id: str) -> AgentMessage | None:
        return (
            await AgentMessage.find({"tenant_id": tenant_id, "agent_id": agent_id, "role": "agent"})
            .sort("-created_at")
            .first_or_none()
        )

    async def get_messages_after_seq(
        self, tenant_id: str, agent_id: str, seq: int, limit: int | None = None
    ) -> list[AgentMessage]:
        query: dict[str, Any] = {
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "seq": {"$gt": seq},
        }
        cursor = AgentMessage.find(query).sort("seq")
        if limit is not None:
            cursor = cursor.limit(limit)
        return await cursor.to_list()

    async def get_messages_between_seq(
        self, tenant_id: str, agent_id: str, start_seq: int, end_seq: int
    ) -> list[AgentMessage]:
        query: dict[str, Any] = {
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "seq": {"$gt": start_seq, "$lte": end_seq},
        }
        return await AgentMessage.find(query).sort("seq").to_list()
