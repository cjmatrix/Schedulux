from __future__ import annotations

from typing import Optional, Dict, Any
from agent_orchestrator.redis_client import (
    get_cached_draft,
    set_cached_draft,
    get_redis_client,
)


class RedisCacheRepository:
    async def get_cached_draft(self, tenant_id: str, agent_id: str) -> Optional[Dict[str, Any]]:
        return await get_cached_draft(tenant_id, agent_id)

    async def set_cached_draft(
        self, tenant_id: str, agent_id: str, draft: Dict[str, Any], ttl: int = 86400 * 3
    ) -> None:
        await set_cached_draft(tenant_id, agent_id, draft, ttl=ttl)

    async def get_raw_crawl_draft(self, tenant_id: str) -> Optional[str]:
        client = get_redis_client()
        return await client.get(f"agent:draft:{tenant_id}")
