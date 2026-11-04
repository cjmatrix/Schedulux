from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Literal

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, SecretStr

logger = logging.getLogger(__name__)


class SupervisorRouting(BaseModel):
    intents: list[Literal["booking", "faq", "handoff"]] = Field(
        default_factory=lambda: ["booking"],
        description="List of specialist agent intents to handle the customer query. Use ['faq', 'booking'] for compound queries.",
    )


def _get_chat_model(temperature: float = 0.0) -> Any:
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if groq_key:
        return ChatGroq(
            model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=SecretStr(groq_key),
            temperature=temperature,
            max_tokens=256,
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
    triage = guardrails.get("triage_emergency") or {}
    if not triage.get("enabled", False):
        return False
    keywords: list[str] = triage.get("keywords") or []
    lowered = message.lower()
    return any(kw.lower() in lowered for kw in keywords)


def _check_handoff_topics(message: str, guardrails: dict[str, Any]) -> bool:
    handoff = guardrails.get("human_handoff") or {}
    if not handoff.get("enabled", False):
        return False
    topics: list[str] = handoff.get("trigger_topics") or []
    lowered = message.lower()
    return any(topic.lower() in lowered for topic in topics)


_ROUTER_SYSTEM = """\
You are a routing classifier for an AI booking concierge system.
Analyze the user message and conversation context to identify which specialist agents need to respond.

Possible intents:
  "booking"  — user is asking about services, pricing, available staff/practitioners/specialists (e.g. "who does shirt stitching?", "who does haircuts?"), checking availability, booking an appointment, cancelling, rescheduling, or viewing bookings
  "faq"      — user is asking about business policies, repayment/refund rules, clinic/shop guidelines, preparation instructions, parking, or general knowledge base topics
  "handoff"  — user is expressing a complaint, legal threat, refund dispute, or demanding to speak with a human

Rules:
1. If the message contains BOTH a booking/service/availability request AND a policy/FAQ question, include BOTH in the list: ["faq", "booking"].
2. If only service inquiry, staff inquiry, or booking/scheduling actions are mentioned, return ["booking"].
3. If only business policy, FAQ, or general knowledge questions are asked, return ["faq"].
4. If the user escalates or demands human contact, return ["handoff"].

Respond ONLY with a JSON object: {"intents": ["<booking|faq|handoff>", ...]}
No other text.
"""


async def classify_intent(
    message: str,
    conversation_history: list[BaseMessage],
    biz_context: dict[str, Any],
) -> list[str]:
    guardrails = biz_context.get("guardrails") or {}

    if _check_emergency_keywords(message, guardrails):
        logger.info("[Supervisor] Emergency keyword detected → emergency")
        return ["emergency"]

    if _check_handoff_topics(message, guardrails):
        logger.info("[Supervisor] Handoff topic detected → handoff")
        return ["handoff"]

    model = _get_chat_model(temperature=0.0)

    recent: list[BaseMessage] = conversation_history[-6:] if conversation_history else []
    classify_messages: list[BaseMessage] = [
        SystemMessage(content=_ROUTER_SYSTEM),
        *recent,
        HumanMessage(content=message),
    ]

    try:
        structured_model = model.with_structured_output(SupervisorRouting)
        routing = await structured_model.ainvoke(classify_messages)
        if isinstance(routing, SupervisorRouting) and routing.intents:
            logger.info("[Supervisor] Classified intents: %s", routing.intents)
            return list(routing.intents)
        if isinstance(routing, dict) and routing.get("intents"):
            return list(routing["intents"])
    except Exception as e:
        logger.warning(
            "[Supervisor] Structured output classification warning (%s) → trying safe text fallback", e
        )

    try:
        result = await model.ainvoke(classify_messages)
        if isinstance(result.content, str):
            text_content = result.content
        elif isinstance(result.content, list):
            text_content = "".join(
                b.get("text", "") if isinstance(b, dict) else str(b) for b in result.content
            )
        else:
            text_content = str(result.content)

        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text_content.strip(), flags=re.MULTILINE).strip()
        parsed = json.loads(cleaned)

        raw_intents = parsed.get("intents")
        if not raw_intents:
            single = parsed.get("intent")
            raw_intents = [single] if single else ["booking"]
        elif isinstance(raw_intents, str):
            raw_intents = [raw_intents]

        valid_intents = [i for i in raw_intents if i in ("booking", "faq", "handoff")]
        if not valid_intents:
            valid_intents = ["booking"]

        logger.info("[Supervisor] Classified intents via fallback: %s", valid_intents)
        return valid_intents
    except Exception as fe:
        logger.warning(
            "[Supervisor] All intent classification attempts failed (%s) → defaulting to ['booking']", fe
        )
        return ["booking"]

