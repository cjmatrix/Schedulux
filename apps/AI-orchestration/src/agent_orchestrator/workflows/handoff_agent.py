"""
Human Handoff Agent — guardrail escalation node.

This is NOT a full LLM agent. It is a deterministic guardrail that reads
the handoff config from AgentRuntimeConfig.guardrails.human_handoff and
returns a pre-configured escalation message. No LLM call is made.

Triggered by:
  - Emergency keywords  (guardrails.triage_emergency.keywords)
  - Human handoff topics (guardrails.human_handoff.trigger_topics)
  — Both evaluated by the Supervisor before reaching here.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_HANDOFF_MSG = (
    "I'm connecting you with our team right away. "
    "Please hold on and someone will assist you shortly."
)

_DEFAULT_EMERGENCY_MSG = (
    "This sounds urgent. Please contact emergency services immediately if needed. "
    "Our team is also available to assist you — "
    "please call us directly."
)


def run_handoff_agent(
    message: str,
    biz_context: dict[str, Any],
    is_emergency: bool = False,
) -> str:
    """
    Returns a pre-configured escalation response.
    No network I/O — pure in-memory resolution.
    """
    guardrails = biz_context.get("guardrails") or {}

    if is_emergency:
        triage = guardrails.get("triage_emergency") or {}
        response_override = triage.get("response_override")
        if response_override:
            return response_override
        return _DEFAULT_EMERGENCY_MSG

    handoff_cfg = guardrails.get("human_handoff") or {}
    handoff_message = handoff_cfg.get("handoff_message") or _DEFAULT_HANDOFF_MSG
    contact = handoff_cfg.get("reception_contact")

    if contact:
        handoff_message = f"{handoff_message}\n\nYou can reach us directly at: {contact}"

    logger.info(
        "[HandoffAgent] Escalating conversation for business %s",
        biz_context.get("business_name"),
    )
    return handoff_message
