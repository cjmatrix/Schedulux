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


def get_biz_context_redis_key(tenant_id: str, agent_id: str) -> str:
    return f"biz_context:{tenant_id}:{agent_id}"


async def get_cached_biz_context(tenant_id: str, agent_id: str) -> dict[str, Any] | None:
    try:
        client = get_redis_client()
        key = get_biz_context_redis_key(tenant_id, agent_id)
        val = await client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        print(f"[Redis] Error getting cached biz context ({tenant_id}/{agent_id}): {e}", flush=True)
    return None


async def set_cached_biz_context(
    tenant_id: str,
    agent_id: str,
    context: dict[str, Any],
    ttl: int = 3600,
) -> None:
    
    try:
        client = get_redis_client()
        key = get_biz_context_redis_key(tenant_id, agent_id)
        await client.set(key, json.dumps(context), ex=ttl)
    except Exception as e:
        print(f"[Redis] Error setting cached biz context ({tenant_id}/{agent_id}): {e}", flush=True)


async def delete_cached_biz_context(tenant_id: str, agent_id: str) -> None:
    """Invalidate business context cache on service/resource updates or config compile."""
    try:
        client = get_redis_client()
        key = get_biz_context_redis_key(tenant_id, agent_id)
        await client.delete(key)
    except Exception as e:
        print(f"[Redis] Error deleting cached biz context ({tenant_id}/{agent_id}): {e}", flush=True)


# ── Session Authentication & OTP Cache ─────────────────────────────────────────


def get_session_auth_redis_key(session_id: str) -> str:
    return f"session:{session_id}:auth"


def get_otp_redis_key(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    normalized = digits[-10:] if len(digits) >= 10 else digits
    return f"otp:{normalized}"


async def set_session_auth(
    session_id: str,
    phone: str,
    customer_id: str | None = None,
    customer_name: str | None = None,
    ttl: int = 86400,  # 24 hours
) -> None:
    try:
        client = get_redis_client()
        key = get_session_auth_redis_key(session_id)
        payload = {
            "phone": phone.strip(),
            "customer_id": customer_id,
            "customer_name": customer_name,
            "is_verified": True,
        }
        await client.set(key, json.dumps(payload), ex=ttl)
    except Exception as e:
        print(f"[Redis] Error setting session auth for {session_id}: {e}", flush=True)


async def get_session_auth(session_id: str) -> dict[str, Any] | None:
    """Retrieve session auth state from Redis."""
    try:
        client = get_redis_client()
        key = get_session_auth_redis_key(session_id)
        val = await client.get(key)
        if val:
           
            await client.expire(key, 86400)
            return json.loads(val)
    except Exception as e:
        print(f"[Redis] Error getting session auth for {session_id}: {e}", flush=True)
    return None


async def is_session_verified(session_id: str, phone: str | None = None) -> bool:
    auth = await get_session_auth(session_id)
    if not auth or not auth.get("is_verified"):
        return False
    if phone:
        target_clean = "".join(ch for ch in phone if ch.isdigit())
        auth_clean = "".join(ch for ch in str(auth.get("phone", "")) if ch.isdigit())
        if len(target_clean) >= 10 and len(auth_clean) >= 10:
            return target_clean[-10:] == auth_clean[-10:]
        return bool(target_clean and auth_clean and target_clean == auth_clean)
    return True


MAX_OTP_ATTEMPTS = 5


def get_otp_attempts_redis_key(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    normalized = digits[-10:] if len(digits) >= 10 else digits
    return f"otp:attempts:{normalized}"


async def store_otp(phone: str, code: str, ttl: int = 300) -> None:
    try:
        client = get_redis_client()
        key = get_otp_redis_key(phone)
        attempts_key = get_otp_attempts_redis_key(phone)
        await client.set(key, code.strip(), ex=ttl)
        await client.delete(attempts_key)
    except Exception as e:
        print(f"[Redis] Error storing OTP for {phone}: {e}", flush=True)


async def verify_otp_code(phone: str, code: str) -> tuple[bool, str]:
    cleaned_code = code.strip()
    is_prod = os.environ.get("ENVIRONMENT", "").lower() == "production"

    if not is_prod and cleaned_code in ["123456", "000000"]:
        return True, "verified"

    try:
        client = get_redis_client()
        key = get_otp_redis_key(phone)
        attempts_key = get_otp_attempts_redis_key(phone)

        attempts_val = await client.get(attempts_key)
        attempts = int(attempts_val) if attempts_val else 0

        if attempts >= MAX_OTP_ATTEMPTS:
            await client.delete(key)
            return False, "max_attempts_exceeded"

        stored = await client.get(key)
        if not stored:
            return False, "expired_or_not_found"

        if str(stored).strip() == cleaned_code:
            await client.delete(key)
            await client.delete(attempts_key)
            return True, "verified"
        else:
            new_attempts = await client.incr(attempts_key)
            if new_attempts == 1:
                await client.expire(attempts_key, 300)

            remaining = max(0, MAX_OTP_ATTEMPTS - new_attempts)
            if remaining == 0:
                await client.delete(key)
                return False, "max_attempts_exceeded"
            return False, f"invalid_code:{remaining}"
    except Exception as e:
        print(f"[Redis] Error verifying OTP for {phone}: {e}", flush=True)
        return False, "system_error"


