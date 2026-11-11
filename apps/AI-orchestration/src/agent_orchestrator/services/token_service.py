from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from typing import Any

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult

from agent_orchestrator.clients.redis_client import get_redis_client
from agent_orchestrator.config.tier_constants import get_tier_config

logger = logging.getLogger(__name__)


def get_current_iso_week() -> str:
    now = datetime.now(UTC)
    year, week, _ = now.isocalendar()
    return f"{year}-W{week:02d}"


def get_weekly_token_redis_key(tenant_id: str) -> str:
    iso_week = get_current_iso_week()
    return f"tenant:{tenant_id}:tokens:{iso_week}"


def extract_tokens_from_response(
    response: Any,
    fallback_prompt: str = "",
    fallback_completion: str = "",
) -> tuple[int, int]:
    """Extracts (input_tokens, output_tokens) from LangChain response or falls back to char estimation."""
    input_tokens = 0
    output_tokens = 0


    usage = getattr(response, "usage_metadata", None)
    if isinstance(usage, dict):
        input_tokens = int(usage.get("input_tokens") or 0)
        output_tokens = int(usage.get("output_tokens") or 0)
        if input_tokens > 0 or output_tokens > 0:
            return input_tokens, output_tokens

 
    resp_meta = getattr(response, "response_metadata", None)
    if isinstance(resp_meta, dict):
        tu = resp_meta.get("token_usage") or resp_meta.get("usage")
        if isinstance(tu, dict):
            input_tokens = int(tu.get("prompt_tokens") or tu.get("input_tokens") or 0)
            output_tokens = int(tu.get("completion_tokens") or tu.get("output_tokens") or 0)
            if input_tokens > 0 or output_tokens > 0:
                return input_tokens, output_tokens

   
    if fallback_prompt:
        input_tokens = max(1, len(fallback_prompt) // 4)
    if fallback_completion:
        output_tokens = max(1, len(fallback_completion) // 4)
    elif hasattr(response, "content") and isinstance(response.content, str):
        output_tokens = max(1, len(response.content) // 4)

    return input_tokens, output_tokens


class TokenUsageTracker(BaseCallbackHandler):
    

    def __init__(self) -> None:
        super().__init__()
        self.input_tokens: int = 0
        self.output_tokens: int = 0
        self.total_tokens: int = 0
        self.model_id: str | None = None
        self.call_count: int = 0
        self.invocations: list[dict[str, Any]] = []

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> Any:
        self.call_count += 1
        llm_out = response.llm_output or {}
        extracted_model = llm_out.get("model_name") or llm_out.get("model")
        if extracted_model and not self.model_id:
            self.model_id = str(extracted_model)

        call_input = 0
        call_output = 0
        found_tokens = False

        for gen_list in response.generations:
            for gen in gen_list:
                msg = getattr(gen, "message", None)
                if msg is not None:
                    inp, out = extract_tokens_from_response(msg)
                    if inp > 0 or out > 0:
                        call_input += inp
                        call_output += out
                        found_tokens = True
                        if not self.model_id and hasattr(msg, "response_metadata"):
                            rm = msg.response_metadata or {}
                            m = rm.get("model_name") or rm.get("model")
                            if m:
                                self.model_id = str(m)

        if not found_tokens and llm_out:
            tu = llm_out.get("token_usage") or llm_out.get("usage") or {}
            if isinstance(tu, dict):
                call_input = int(tu.get("prompt_tokens") or tu.get("input_tokens") or 0)
                call_output = int(tu.get("completion_tokens") or tu.get("output_tokens") or 0)
                if call_input > 0 or call_output > 0:
                    found_tokens = True

        if not found_tokens:
            for gen_list in response.generations:
                for gen in gen_list:
                    text = getattr(gen, "text", "") or ""
                    if not text:
                        m = getattr(gen, "message", None)
                        if m and hasattr(m, "content") and isinstance(m.content, str):
                            text = m.content
                    if text:
                        call_output += max(1, len(text) // 4)
            if call_input == 0 and call_output > 0:
                call_input = max(1, call_output * 2)

        self.input_tokens += call_input
        self.output_tokens += call_output
        self.total_tokens += (call_input + call_output)
        self.invocations.append({
            "call_index": self.call_count,
            "model": extracted_model or self.model_id,
            "input_tokens": call_input,
            "output_tokens": call_output,
        })


class TokenTrackingService:
    @staticmethod
    async def record_tokens(
        tenant_id: str,
        agent_id: str,
        source: str,
        input_tokens: int,
        output_tokens: int,
        model_id: str | None = None,
        event_id: str | None = None,
    ) -> int:
      
        if not tenant_id:
            return 0

        total_tokens = input_tokens + output_tokens
        if total_tokens <= 0:
            return 0

        effective_model = model_id or os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        redis_key = get_weekly_token_redis_key(tenant_id)

       
        try:
            client = get_redis_client()
            new_val = await client.incrby(redis_key, total_tokens)
            ttl = await client.ttl(redis_key)
            if ttl < 0:
               
                await client.expire(redis_key, 35 * 86400)
            logger.info(
                "[TokenService] Incremented %s by %d (total: %d) for [%s/%s]",
                redis_key,
                total_tokens,
                new_val,
                tenant_id,
                agent_id,
            )
        except Exception as e:
            logger.error("[TokenService] Redis INCRBY error for tenant %s: %s", tenant_id, e)

       
        now_utc = datetime.now(UTC)
        det_event_id = (
            event_id
            if event_id
            else f"evt_tok_{tenant_id}_{agent_id}_{int(now_utc.timestamp() * 1000)}"
        )

        event_payload = {
            "event_id": det_event_id,
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "source": source,
            "model_id": effective_model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "created_at": now_utc.isoformat(),
        }

  
        try:
            from agent_orchestrator.services.outbox_service import get_outbox_service

            outbox_service = get_outbox_service()
            outbox_doc = await outbox_service.save_event(
                event_id=det_event_id,
                aggregate_type="token_usage",
                aggregate_id=agent_id or tenant_id,
                event_type="billing.tokens.consumed",
                topic=os.environ.get("KAFKA_TOKEN_TOPIC", "billing.tokens.consumed"),
                partition_key=tenant_id,
                payload=event_payload,
            )
        
            
            outbox_service.dispatch_async(outbox_doc)
        except Exception as e:
            logger.error("[TokenService] Outbox save error for tenant %s: %s", tenant_id, e)

        return total_tokens

    @staticmethod
    async def check_weekly_quota(tenant_id: str, tier: str | None = None) -> tuple[bool, int, int]:
        """
        Returns (is_exceeded, current_tokens, limit).
        Evaluates current Redis usage against tier weekly_token_limit.
        """
        if not tenant_id:
            return False, 0, -1

        tier_cfg = get_tier_config(tier)
        limit = tier_cfg.get("weekly_token_limit", 100_000)
        if limit == -1:
            return False, 0, -1

        try:
            client = get_redis_client()
            redis_key = get_weekly_token_redis_key(tenant_id)
            raw = await client.get(redis_key)
            current = int(raw) if raw else 0
            is_exceeded = current >= limit
            return is_exceeded, current, limit
        except Exception as e:
            logger.error("[TokenService] Failed to check weekly quota for tenant %s: %s", tenant_id, e)
            return False, 0, limit

