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

    async def get_messages(
        self,
        session_id: str,
        before: datetime | None = None,
        limit: int = 20,
    ) -> tuple[list[CustomerMessage], bool, str | None]:
        query: dict[str, Any] = {"session_id": session_id}
        if before:
            query["created_at"] = {"$lt": before}

        messages = await CustomerMessage.find(query).sort("-created_at").limit(limit + 1).to_list()
        has_more = len(messages) > limit
        slice_msgs = messages[:limit]

        next_cursor = slice_msgs[-1].created_at.isoformat() if slice_msgs and has_more else None

        return list(reversed(slice_msgs)), has_more, next_cursor

    async def get_recent_messages(
        self,
        session_id: str,
        limit: int = 10,
    ) -> list[CustomerMessage]:
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
        await CustomerConversation.find({"session_id": session_id}).update({"$set": updates})

    async def mark_conversation_verified(
        self,
        session_id: str,
        customer_phone: str | None = None,
        customer_id: str | None = None,
    ) -> None:
        updates: dict[str, Any] = {
            "is_verified": True,
            "verified_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        if customer_phone:
            updates["customer_phone"] = customer_phone
        if customer_id:
            updates["customer_id"] = customer_id

        await CustomerConversation.find({"session_id": session_id}).update({"$set": updates})
