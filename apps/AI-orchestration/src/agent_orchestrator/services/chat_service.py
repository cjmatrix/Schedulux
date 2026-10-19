from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from agent_orchestrator.domain.protocols import MessageRepository


@dataclass
class ChatMessageDTO:
    id: str
    tenant_id: str
    agent_id: str
    role: str
    content: str
    created_at: str


@dataclass
class ChatHistoryResult:
    messages: List[ChatMessageDTO]
    next_cursor: str
    has_more: bool


class ChatService:
    def __init__(self, message_repo: MessageRepository):
        self.message_repo = message_repo

    async def get_history(
        self, tenant_id: str, agent_id: str, before_iso: Optional[str], limit: int
    ) -> ChatHistoryResult:
        safe_limit = min(max(1, limit), 100)
        before_dt: Optional[datetime] = None

        if before_iso:
            try:
                iso_clean = before_iso.replace("Z", "+00:00")
                before_dt = datetime.fromisoformat(iso_clean)
            except Exception as e:
                print(f"[ChatService] Cursor parse warning for '{before_iso}': {e}", flush=True)

        messages, has_more, next_cursor = await self.message_repo.get_messages(
            tenant_id, agent_id, before_dt, safe_limit
        )

        dtos = [
            ChatMessageDTO(
                id=str(m.id),
                tenant_id=m.tenant_id,
                agent_id=m.agent_id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
            )
            for m in messages
        ]

        return ChatHistoryResult(
            messages=dtos,
            next_cursor=next_cursor or "",
            has_more=has_more,
        )
