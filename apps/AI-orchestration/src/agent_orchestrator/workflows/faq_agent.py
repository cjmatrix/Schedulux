"""
FAQ / RAG Agent — answers knowledge base and policy questions.

Tools available:
  search_knowledge_base, search_resources

Does NOT have access to any scheduling mutation tools.
Supervisor_prompt is injected here too so business-owner tone instructions
(e.g. "always emphasise our premium Bridal Suite package") apply consistently.
"""
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

_FAQ_TOOLS = {"search_knowledge_base", "search_resources", "search_services"}



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

    return f"""You are the Knowledge & FAQ specialist for {biz_context.get("business_name")}.
Your sole purpose: answer questions about the business, services, staff, and policies accurately.{custom_instructions_block}

[Context]
Current UTC Time: {now_iso}
Business Timezone: {biz_context.get("timezone")}
Tenant ID: {tenant_id}
Agent ID: {agent_id}

[Protocol]
1. For any question about policies, procedures, clinic rules, preparation instructions, FAQs,
   or business information — invoke search_knowledge_base with tenant_id="{tenant_id}", agent_id="{agent_id}".
2. For questions about specific services, packages, treatment options, or pricing details —
   invoke search_services with tenant_id="{tenant_id}", agent_id="{agent_id}".
3. For detailed questions about staff members, their qualifications, specialties, or equipment —
   invoke search_resources with tenant_id="{tenant_id}", agent_id="{agent_id}".
4. Ground every answer STRICTLY on retrieved content. Do NOT fabricate policies, prices, or credentials.
5. If nothing is retrieved, say: "I don't have that information on file — our team can help you directly."
6. If the customer then wants to book, tell them: "I can connect you with our booking assistant right away."
7. Tone: knowledgeable, warm, concise.
"""



async def run_faq_agent(
    tenant_id: str,
    agent_id: str,
    message: str,
    conversation_history: list[BaseMessage],
    biz_context: dict[str, Any],
    all_tools: list[BaseTool],
) -> str:
    """Execute the FAQ/RAG agent with only knowledge tools."""
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
