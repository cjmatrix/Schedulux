from __future__ import annotations

from typing import Any

from agent_orchestrator.clients.redis_client import (
    delete_cached_biz_context,
    delete_cached_draft,
    get_cached_biz_context,
    get_cached_draft,
    get_redis_client,
    set_cached_biz_context,
    set_cached_draft,
)
from agent_orchestrator.domain.protocols import CacheRepository


class RedisCacheRepository(CacheRepository):
    async def get_cached_draft(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None:
        return await get_cached_draft(tenant_id, agent_id)

    async def set_cached_draft(
        self, tenant_id: str, agent_id: str, draft: dict[str, Any], ttl: int = 86400 * 3
    ) -> None:
        await set_cached_draft(tenant_id, agent_id, draft, ttl=ttl)

    async def delete_cached_draft(self, tenant_id: str, agent_id: str) -> None:
        await delete_cached_draft(tenant_id, agent_id)

    async def get_cached_biz_context(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None:
        return await get_cached_biz_context(tenant_id, agent_id)

    async def set_cached_biz_context(
        self, tenant_id: str, agent_id: str, context: dict[str, Any], ttl: int = 3600
    ) -> None:
        await set_cached_biz_context(tenant_id, agent_id, context, ttl=ttl)

    async def delete_cached_biz_context(self, tenant_id: str, agent_id: str) -> None:
        await delete_cached_biz_context(tenant_id, agent_id)

    async def get_raw_crawl_draft(self, tenant_id: str) -> str | None:
        client = get_redis_client()
        return await client.get(f"agent:draft:{tenant_id}")
