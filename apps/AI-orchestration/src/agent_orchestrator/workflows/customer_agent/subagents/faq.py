from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import SecretStr

logger = logging.getLogger(__name__)

_FAQ_TOOLS = {"search_knowledge_base"}


def _get_chat_model(temperature: float = 0.1) -> Any:
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if groq_key:
        return ChatGroq(
            model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=SecretStr(groq_key),
            temperature=temperature,
            max_tokens=2048,
        )
    elif gemini_key:
        return ChatGoogleGenerativeAI(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=gemini_key,
            temperature=temperature,
            max_output_tokens=2048,
        )
    else:
        return ChatOpenAI(model="gpt-4o-mini", temperature=temperature)


def _build_faq_system_prompt(
    tenant_id: str,
    agent_id: str,
    biz_context: dict[str, Any],
) -> str:
    now_iso = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    supervisor_prompt = biz_context.get("supervisor_prompt") or ""

    custom_instructions_block = ""
    if supervisor_prompt.strip():
        custom_instructions_block = f"""
[Business Owner Instructions — ALWAYS FOLLOW THESE]
{supervisor_prompt.strip()}
"""

    return f"""You are the Knowledge & Policy specialist for {biz_context.get("business_name")}.
Your sole purpose: answer customer questions about business policies, procedures, rules, preparation guidelines, and general knowledge accurately.{custom_instructions_block}

[Context]
Current UTC Time: {now_iso}
Business Timezone: {biz_context.get("timezone")}
Tenant ID: {tenant_id}
Agent ID: {agent_id}

[Protocol]
1. For any question about policies, refund/cancellation rules, procedures, preparation guidelines, or general business information:
   Invoke `search_knowledge_base(query=..., tenant_id="{tenant_id}", agent_id="{agent_id}")`.
2. Ground every answer STRICTLY on retrieved content from the knowledge base. Do NOT fabricate policies, terms, or guidelines.
3. If no matching information is found in the knowledge base, say: "I don't have that information on file — our team will be happy to assist you directly."
4. If the customer indicates they want to schedule an appointment or book, let them know our booking concierge can assist them right away.
5. Tone: knowledgeable, warm, concise, and helpful.
"""


async def run_faq_agent(
    tenant_id: str,
    agent_id: str,
    message: str,
    conversation_history: list[BaseMessage],
    biz_context: dict[str, Any],
    all_tools: list[BaseTool],
) -> str:
    faq_tools = [t for t in all_tools if t.name in _FAQ_TOOLS]

    langchain_msgs: list[BaseMessage] = []
    for m in conversation_history:
        langchain_msgs.append(m)
    langchain_msgs.append(HumanMessage(content=message))

    system_prompt = _build_faq_system_prompt(tenant_id, agent_id, biz_context)
    model = _get_chat_model(temperature=0.1)

    agent = create_react_agent(
        model=model,
        tools=faq_tools,
        prompt=SystemMessage(content=system_prompt),
    )

    try:
        result = await agent.ainvoke({"messages": langchain_msgs})
        final = result["messages"][-1]
        if isinstance(final.content, str):
            return final.content
        if isinstance(final.content, list):
            texts = [
                item["text"] if isinstance(item, dict) and item.get("text") else str(item)
                for item in final.content
            ]
            return "\n".join(texts)
        return str(final.content)
    except Exception as e:
        logger.error("[FaqAgent] Error: %s", e, exc_info=True)
        return (
            "I'm having trouble retrieving that information right now. "
            "Please feel free to call us directly or try again in a moment."
        )

