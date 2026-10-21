from __future__ import annotations

import json
import os
from typing import Any

import redis.asyncio as aioredis
from dotenv import load_dotenv

local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(local_env)

REDIS_URI = os.environ.get("REDIS_URI", "redis://localhost:6379")
_redis_client: aioredis.Redis | None = None


def get_redis_client() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(REDIS_URI, decode_responses=True)
    return _redis_client


def get_draft_redis_key(tenant_id: str, agent_id: str) -> str:
    return f"agent:draft:{tenant_id}:{agent_id}"


async def get_cached_draft(tenant_id: str, agent_id: str) -> dict[str, Any] | None:
    try:
        client = get_redis_client()
        key = get_draft_redis_key(tenant_id, agent_id)
        val = await client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        print(f"[Redis] Error getting cached draft ({tenant_id}/{agent_id}): {e}", flush=True)
    return None


async def set_cached_draft(
    tenant_id: str,
    agent_id: str,
    draft: dict[str, Any],
    ttl: int = 86400 * 3,
) -> None:
    try:
        client = get_redis_client()
        key = get_draft_redis_key(tenant_id, agent_id)
        await client.set(key, json.dumps(draft), ex=ttl)
    except Exception as e:
        print(f"[Redis] Error setting cached draft ({tenant_id}/{agent_id}): {e}", flush=True)


async def delete_cached_draft(tenant_id: str, agent_id: str) -> None:
    try:
        client = get_redis_client()
        key = get_draft_redis_key(tenant_id, agent_id)
        await client.delete(key)
    except Exception as e:
        print(f"[Redis] Error deleting cached draft ({tenant_id}/{agent_id}): {e}", flush=True)
