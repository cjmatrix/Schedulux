from __future__ import annotations

import json
import os
import secrets
from typing import Any, cast

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


def get_biz_context_redis_key(tenant_id: str, agent_id: str, mode: str = "live") -> str:
    return f"biz_context:{tenant_id}:{agent_id}:{mode}"


async def get_cached_biz_context(
    tenant_id: str,
    agent_id: str,
    mode: str = "live",
) -> dict[str, Any] | None:
    try:
        client = get_redis_client()
        key = get_biz_context_redis_key(tenant_id, agent_id, mode)
        val = await client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        print(
            f"[Redis] Error getting cached biz context ({tenant_id}/{agent_id}/{mode}): {e}",
            flush=True,
        )
    return None


async def set_cached_biz_context(
    tenant_id: str,
    agent_id: str,
    context: dict[str, Any],
    ttl: int = 3600,
    mode: str = "live",
) -> None:
    try:
        client = get_redis_client()
        key = get_biz_context_redis_key(tenant_id, agent_id, mode)
        await client.set(key, json.dumps(context), ex=ttl)
    except Exception as e:
        print(
            f"[Redis] Error setting cached biz context ({tenant_id}/{agent_id}/{mode}): {e}",
            flush=True,
        )


def get_whitelist_redis_key(tenant_id: str, agent_id: str) -> str:
    return f"agent:{tenant_id}:{agent_id}:whitelist"


async def delete_cached_whitelist(tenant_id: str, agent_id: str) -> None:
    """Invalidate distributed whitelist cache for customer API gateway."""
    try:
        client = get_redis_client()
        key = get_whitelist_redis_key(tenant_id, agent_id)
        await client.delete(key)
    except Exception as e:
        print(f"[Redis] Error deleting whitelist ({tenant_id}/{agent_id}): {e}", flush=True)


async def delete_cached_biz_context(tenant_id: str, agent_id: str) -> None:
    """Invalidate business context and whitelist caches on service/resource updates or config compile."""
    try:
        client = get_redis_client()
        live_key = get_biz_context_redis_key(tenant_id, agent_id, "live")
        sandbox_key = get_biz_context_redis_key(tenant_id, agent_id, "sandbox")
        legacy_key = f"biz_context:{tenant_id}:{agent_id}"
        whitelist_key = get_whitelist_redis_key(tenant_id, agent_id)
        await client.delete(live_key, sandbox_key, legacy_key, whitelist_key)
    except Exception as e:
        print(
            f"[Redis] Error deleting cached biz context ({tenant_id}/{agent_id}): {e}", flush=True
        )


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
    if not session_id or not phone:
        return False
    auth = await get_session_auth(session_id)
    if not auth or not auth.get("is_verified"):
        return False
    target_clean = "".join(ch for ch in phone if ch.isdigit())
    auth_clean = "".join(ch for ch in str(auth.get("phone", "")) if ch.isdigit())
    if len(target_clean) >= 10 and len(auth_clean) >= 10:
        return target_clean[-10:] == auth_clean[-10:]
    return bool(target_clean and auth_clean and target_clean == auth_clean)


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


# ── Provisional Slot Hold Keys & Distributed Locking ─────────────────────────


def get_slot_hold_key(tenant_id: str, agent_id: str, resource_id: str, start_time: str) -> str:
    return f"sched:hold:{tenant_id}:{agent_id}:{resource_id}:{start_time}"


def get_session_active_hold_key(session_id: str) -> str:
    return f"sched:session:{session_id}:active_hold"


def get_hold_token_data_key(hold_token: str) -> str:
    return f"sched:hold:token:{hold_token}"


async def get_active_hold_for_session(session_id: str) -> str | None:
    """Retrieve active provisional hold_token for a chat session if present."""
    if not session_id:
        return None
    try:
        client = get_redis_client()
        key = get_session_active_hold_key(session_id)
        val = await client.get(key)
        if val:
            return str(val).strip()
    except Exception as e:
        print(f"[Redis] Error getting active hold for session {session_id}: {e}", flush=True)
    return None


async def get_hold_token_data(hold_token: str) -> dict[str, Any] | None:
    """Retrieve metadata stored for a given hold_token."""
    if not hold_token:
        return None
    try:
        client = get_redis_client()
        key = get_hold_token_data_key(hold_token)
        val = await client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        print(f"[Redis] Error getting hold token data for {hold_token}: {e}", flush=True)
    return None


_ACQUIRE_HOLDS_LUA = """
for i = 1, #KEYS do
    if redis.call('EXISTS', KEYS[i]) == 1 then
        return 0
    end
end
for i = 1, #KEYS do
    redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
end
return 1
"""

_RELEASE_HOLDS_LUA = """
local count = 0
for i = 1, #KEYS do
    if ARGV[1] == '' or redis.call('GET', KEYS[i]) == ARGV[1] then
        redis.call('DEL', KEYS[i])
        count = count + 1
    end
end
return count
"""


async def acquire_slot_holds(
    tenant_id: str,
    agent_id: str,
    resource_ids: list[str],
    start_time: str,
    session_id: str | None = None,
    ttl_seconds: int = 600,
) -> tuple[bool, str, str]:

    if not resource_ids:
        return False, "", "No resources specified for hold"

    clamped_ttl = max(60, min(600, ttl_seconds))

    try:
        client = get_redis_client()

        if session_id:
            await release_session_hold(session_id)

        hold_token = f"hld_{secrets.token_hex(6)}"
        slot_keys = [
            get_slot_hold_key(tenant_id, agent_id, r_id, start_time) for r_id in resource_ids
        ]

        eval_call = cast(
            Any,
            client.eval(_ACQUIRE_HOLDS_LUA, len(slot_keys), *slot_keys, hold_token, clamped_ttl),
        )
        result = await eval_call if hasattr(eval_call, "__await__") else eval_call
        if result != 1:
            return (
                False,
                "",
                "This time slot is temporarily held by another customer. Please choose another time.",
            )

        token_meta = {
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "resource_ids": resource_ids,
            "start_time": start_time,
            "session_id": session_id or "",
        }
        await client.set(
            get_hold_token_data_key(hold_token),
            json.dumps(token_meta),
            ex=clamped_ttl,
        )

        if session_id:
            await client.setex(get_session_active_hold_key(session_id), clamped_ttl, hold_token)

        return True, hold_token, ""
    except Exception as e:
        print(f"[Redis] Error acquiring slot holds: {e}", flush=True)
        return False, "", f"Failed to acquire slot hold: {e}"


async def release_slot_holds(
    tenant_id: str,
    agent_id: str,
    resource_ids: list[str],
    start_time: str,
    hold_token: str | None = None,
) -> int:

    if not resource_ids:
        return 0
    try:
        client = get_redis_client()
        slot_keys = [
            get_slot_hold_key(tenant_id, agent_id, r_id, start_time) for r_id in resource_ids
        ]
        token_arg = hold_token or ""
        eval_call = cast(
            Any, client.eval(_RELEASE_HOLDS_LUA, len(slot_keys), *slot_keys, token_arg)
        )
        deleted = await eval_call if hasattr(eval_call, "__await__") else eval_call
        if hold_token:
            await client.delete(get_hold_token_data_key(hold_token))
        return int(deleted or 0)
    except Exception as e:
        print(f"[Redis] Error releasing slot holds: {e}", flush=True)
        return 0


async def release_session_hold(session_id: str) -> bool:

    if not session_id:
        return False
    try:
        client = get_redis_client()
        session_key = get_session_active_hold_key(session_id)
        hold_token = await client.get(session_key)
        if not hold_token:
            return False

        token_str = str(hold_token).strip()
        raw_meta = await client.get(get_hold_token_data_key(token_str))
        if raw_meta:
            meta = json.loads(raw_meta)
            tenant_id = meta.get("tenant_id", "")
            agent_id = meta.get("agent_id", "")
            resource_ids = meta.get("resource_ids", [])
            start_time = meta.get("start_time", "")
            if tenant_id and resource_ids and start_time:
                await release_slot_holds(
                    tenant_id=tenant_id,
                    agent_id=agent_id,
                    resource_ids=resource_ids,
                    start_time=start_time,
                    hold_token=token_str,
                )

        await client.delete(session_key, get_hold_token_data_key(token_str))
        return True
    except Exception as e:
        print(f"[Redis] Error releasing session hold for {session_id}: {e}", flush=True)
        return False
