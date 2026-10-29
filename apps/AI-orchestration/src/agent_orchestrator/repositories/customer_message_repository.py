from __future__ import annotations

from datetime import datetime
from typing import Any

from agent_orchestrator.models import CustomerConversation, CustomerMessage
from agent_orchestrator.repositories.message_repository import estimate_tokens


class CustomerMessageRepository:
    async def get_or_create_conversation(
        self,
        session_id: str,
        tenant_id: str,
        agent_id: str,
    ) -> CustomerConversation:
        conv = await CustomerConversation.find_one({"session_id": session_id})
        if conv:
            return conv

        conv = CustomerConversation(
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
        )
        await conv.insert()
        return conv

    async def save_message(
        self,
        session_id: str,
        tenant_id: str,
        agent_id: str,
        role: str,
        content: str,
    ) -> CustomerMessage:
        token_count = estimate_tokens(content)
        msg = CustomerMessage(
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            role=role,
            content=content,
            token_count=token_count,
        )
        await msg.insert()

        await CustomerConversation.find({"session_id": session_id}).update(
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        return msg

    async def get_recent_messages(
        self,
        session_id: str,
        limit: int = 10,
    ) -> list[CustomerMessage]:
        """Fetch last `limit` messages in chronological order (sliding window)."""
        messages = (
            await CustomerMessage.find({"session_id": session_id})
            .sort("-created_at")
            .limit(limit)
            .to_list()
        )

        return list(reversed(messages))

    async def update_conversation_customer(
        self,
        session_id: str,
        customer_id: str | None = None,
        customer_name: str | None = None,
        customer_phone: str | None = None,
    ) -> None:
        updates: dict[str, Any] = {"updated_at": datetime.utcnow()}
        if customer_id:
            updates["customer_id"] = customer_id
        if customer_name:
            updates["customer_name"] = customer_name
        if customer_phone:
            updates["customer_phone"] = customer_phone

        await CustomerConversation.find({"session_id": session_id}).update({"$set": updates})
