from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Tuple, Dict, Any
from agent_orchestrator.models import AgentMessage


class MongoMessageRepository:
    async def get_messages(
        self, tenant_id: str, agent_id: str, before: Optional[datetime], limit: int
    ) -> Tuple[List[AgentMessage], bool, Optional[str]]:
        query: Dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}
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
        msg = AgentMessage(
            tenant_id=tenant_id,
            agent_id=agent_id,
            role=role,
            content=content,
        )
        await msg.insert()
        return msg

    async def count_messages(self, tenant_id: str, agent_id: str) -> int:
        return await AgentMessage.find({"tenant_id": tenant_id, "agent_id": agent_id}).count()

    async def get_latest_agent_message(
        self, tenant_id: str, agent_id: str
    ) -> Optional[AgentMessage]:
        return (
            await AgentMessage.find(
                {"tenant_id": tenant_id, "agent_id": agent_id, "role": "agent"}
            )
            .sort("-created_at")
            .first_or_none()
        )
