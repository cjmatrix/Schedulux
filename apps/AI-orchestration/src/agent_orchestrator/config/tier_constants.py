from __future__ import annotations

from typing import Any

STATIC_TIER_CONFIGS: dict[str, dict[str, Any]] = {
    "starter": {
        "tier": "starter",
        "name": "Starter",
        "max_agents": 5,
        "max_services": 2,
        "max_resources": 2,
        "max_kb_docs": 3,
        "max_kb_doc_size_mb": 5,
        "weekly_token_limit": 100_000,
        "rate_limit_rpm": 60,
        "weekly_crawl_limit": 5,
        "status": "active",
    },
    "pro": {
        "tier": "pro",
        "name": "Pro",
        "max_agents": 2,
        "max_services": 15,
        "max_resources": 10,
        "max_kb_docs": 10,
        "max_kb_doc_size_mb": 25,
        "weekly_token_limit": 500_000,
        "rate_limit_rpm": 120,
        "weekly_crawl_limit": 20,
        "status": "active",
    },
    "business": {
        "tier": "business",
        "name": "Business",
        "max_agents": 5,
        "max_services": 50,
        "max_resources": 50,
        "max_kb_docs": 50,
        "max_kb_doc_size_mb": 100,
        "weekly_token_limit": 2_500_000,
        "rate_limit_rpm": 300,
        "weekly_crawl_limit": 50,
        "status": "active",
    },
    "enterprise": {
        "tier": "enterprise",
        "name": "Enterprise",
        "max_agents": -1,
        "max_services": -1,
        "max_resources": -1,
        "max_kb_docs": -1,
        "max_kb_doc_size_mb": 250,
        "weekly_token_limit": -1,
        "rate_limit_rpm": 1000,
        "weekly_crawl_limit": -1,
        "status": "active",
    },
}

DEFAULT_TIER = "starter"


def get_tier_config(tier: str | None = None) -> dict[str, Any]:
    if not tier:
        return STATIC_TIER_CONFIGS[DEFAULT_TIER]
    normalized = tier.strip().lower()
    return STATIC_TIER_CONFIGS.get(normalized, STATIC_TIER_CONFIGS[DEFAULT_TIER])


async def get_cached_tier_config(
    tier: str | None = None, redis_client: Any = None
) -> dict[str, Any]:
    fallback = get_tier_config(tier)
    if not tier:
        return fallback
    normalized = tier.strip().lower()
    try:
        if redis_client is None:
            from agent_orchestrator.clients.redis_client import get_redis_client

            redis_client = get_redis_client()
        raw = await redis_client.get(f"tier_config:{normalized}")
        if raw:
            import json

            data = json.loads(raw)
            if isinstance(data, dict):
                return {**fallback, **data}
    except Exception as e:
        import logging

        logging.getLogger(__name__).warning(
            "[TierConfig] Failed to read tier_config:%s from Redis: %s", normalized, e
        )
    return fallback
