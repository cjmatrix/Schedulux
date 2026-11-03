
from __future__ import annotations

import json
import logging
import os
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

logger = logging.getLogger(__name__)


def _get_chat_model(temperature: float = 0.0) -> Any:
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if groq_key:
        return ChatGroq(
            model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=SecretStr(groq_key),
            temperature=temperature,
            max_tokens=256,  # intent classification → short output
        )
    elif gemini_key:
        return ChatGoogleGenerativeAI(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=gemini_key,
            temperature=temperature,
            max_output_tokens=256,
        )
    else:
        return ChatOpenAI(model="gpt-4o-mini", temperature=temperature)


def _check_emergency_keywords(message: str, guardrails: dict[str, Any]) -> bool:
    """Fast in-memory keyword scan before calling LLM — avoids latency for emergency detection."""
    triage = guardrails.get("triage_emergency") or {}
    if not triage.get("enabled", False):
        return False
    keywords: list[str] = triage.get("keywords") or []
    lowered = message.lower()
    return any(kw.lower() in lowered for kw in keywords)


def _check_handoff_topics(message: str, guardrails: dict[str, Any]) -> bool:
    """Fast in-memory check for human handoff topics before calling LLM."""
    handoff = guardrails.get("human_handoff") or {}
    if not handoff.get("enabled", False):
        return False
    topics: list[str] = handoff.get("trigger_topics") or []
    lowered = message.lower()
    return any(topic.lower() in lowered for topic in topics)


_ROUTER_SYSTEM = """\
You are a routing classifier for an AI booking concierge system.
Classify the user message into exactly ONE of these intents:

  "booking"  — user wants to check availability, book an appointment, cancel a booking, or reschedule
  "faq"      — user is asking about business policies, staff information, service details, pricing, procedures, or FAQs
  "handoff"  — user is expressing a complaint, legal threat, refund demand, or needs to speak with a human

Respond ONLY with a JSON object: {"intent": "<booking|faq|handoff>"}
No other text.
"""


async def classify_intent(
    message: str,
    conversation_history: list[BaseMessage],
    biz_context: dict[str, Any],
) -> str:
    """
    Returns "booking", "faq", or "handoff".
    Fast-path guardrail checks run before LLM to minimise latency.
    """
    guardrails = biz_context.get("guardrails") or {}

    # ── Fast-path: emergency keywords → instant handoff (no LLM call) ─────────
    if _check_emergency_keywords(message, guardrails):
        logger.info("[Supervisor] Emergency keyword detected → emergency")
        return "emergency"


    if _check_handoff_topics(message, guardrails):
        logger.info("[Supervisor] Handoff topic detected → handoff")
        return "handoff"

    # ── LLM-based intent classification ───────────────────────────────────────
    model = _get_chat_model(temperature=0.0)

    # Include last 3 turns for context so "book it" after availability check routes correctly
    recent: list[BaseMessage] = conversation_history[-6:] if conversation_history else []
    classify_messages: list[BaseMessage] = [
        SystemMessage(content=_ROUTER_SYSTEM),
        *recent,
        HumanMessage(content=message),
    ]

    try:
        result = await model.ainvoke(classify_messages)
        content = result.content if isinstance(result.content, str) else str(result.content)
        parsed = json.loads(content.strip())
        intent = parsed.get("intent", "faq")
        if intent not in ("booking", "faq", "handoff"):
            intent = "faq"
        logger.info("[Supervisor] Classified intent: %s", intent)
        return intent
    except Exception as e:
        logger.warning("[Supervisor] Intent classification failed (%s) → defaulting to booking", e)
        return "booking"
