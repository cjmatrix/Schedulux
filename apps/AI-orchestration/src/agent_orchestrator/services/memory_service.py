from __future__ import annotations

import json
from typing import Optional, List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from agent_orchestrator.models import AgentDraft, AgentMessage
from agent_orchestrator.domain.protocols import (
    MessageRepository,
    DraftRepository,
    MemoryQueue,
)
from agent_orchestrator.config import (
    MEMORY_TRIGGER_THRESHOLD,
    MEMORY_CHUNK_SIZE,
    MEMORY_KEEP_RECENT,
    MEMORY_SUMMARIZER_MODEL,
)
from agent_orchestrator.utils.embedding_util import embed_texts, embed_query
from agent_orchestrator.utils.qdrant_util import get_qdrant_store


class MemoryService:
    def __init__(
        self,
        message_repo: MessageRepository,
        draft_repo: DraftRepository,
        memory_queue: MemoryQueue,
    ):
        self.message_repo = message_repo
        self.draft_repo = draft_repo
        self.memory_queue = memory_queue
        self.qdrant_store = get_qdrant_store()

    async def check_and_trigger_memory(self, tenant_id: str, agent_id: str) -> bool:
        if not tenant_id or not agent_id:
            return False

        agent_draft = await self.draft_repo.get_agent_draft(tenant_id, agent_id)
        last_summarized = agent_draft.last_summarized_seq if agent_draft else 0

        total_count = await self.message_repo.count_messages(tenant_id, agent_id)
        unsummarized_count = total_count - last_summarized

        if unsummarized_count >= MEMORY_TRIGGER_THRESHOLD:
            # Cut off the oldest MEMORY_CHUNK_SIZE (e.g. 8) unsummarized messages for compression
            cutoff_seq = last_summarized + MEMORY_CHUNK_SIZE
            if cutoff_seq <= total_count:
                await self.memory_queue.enqueue_summarization_job(
                    tenant_id=tenant_id,
                    agent_id=agent_id,
                    total_count=total_count,
                    cutoff_seq=cutoff_seq,
                )
                return True
        return False

    async def consolidate_memory(
        self, tenant_id: str, agent_id: str, cutoff_seq: int
    ) -> Dict[str, Any]:
        agent_draft = await self.draft_repo.get_agent_draft(tenant_id, agent_id)
        if not agent_draft:
            return {"status": "skipped", "reason": "agent_draft_not_found"}

        last_seq = agent_draft.last_summarized_seq or 0
        existing_summary = agent_draft.conversation_summary or ""

        # Fetch messages up to cutoff_seq
        all_msgs = await AgentMessage.find(
            {"tenant_id": tenant_id, "agent_id": agent_id}
        ).sort("created_at").to_list()

        unprocessed = all_msgs[last_seq:cutoff_seq]
        if not unprocessed:
            return {"status": "skipped", "reason": "no_new_messages"}

      
        transcript_lines = []
        for idx, m in enumerate(unprocessed, start=last_seq + 1):
            role = "Tenant" if m.role in ("tenant", "user") else "Agent"
            transcript_lines.append(f"[{idx}] {role}: {m.content}")
        transcript_text = "\n".join(transcript_lines)

        llm = ChatGoogleGenerativeAI(
            model=MEMORY_SUMMARIZER_MODEL,
            temperature=0.1,
        )

        prompt = f"""You are the Memory Consolidation Engine for Schedulux AI.
Your job is to analyze the conversation segment below and perform two tasks:

1. ROLLING SUMMARY:
Update the ongoing conversation summary. Be concise, factual, and capture key business decisions.
Previous Summary:
"{existing_summary}"

2. FACT EXTRACTION:
Extract permanent business rules, constraints, policies, or preferences as atomic standalone facts.
Examples of facts:
- "Closed on Sundays and public holidays."
- "Brake inspection requires 45 minutes duration."
- "Dr. Sarah only takes morning appointments."

Return ONLY valid JSON matching this exact structure:
{{
  "updated_summary": "Concise updated summary paragraph here...",
  "extracted_facts": [
    {{
      "fact": "Standalone business rule or constraint",
      "category": "policy|scheduling|service|staff"
    }}
  ]
}}

Transcript to analyze:
{transcript_text}
"""

        try:
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            raw_text = response.content.strip()
            # Clean possible markdown fencing
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text.strip())
            new_summary = parsed.get("updated_summary", existing_summary)
            extracted_facts = parsed.get("extracted_facts", [])

           
            agent_draft.conversation_summary = new_summary
            agent_draft.last_summarized_seq = cutoff_seq
            await agent_draft.save()

            # Batch embed extracted facts via Voyage AI and store in Qdrant
            if extracted_facts:
                fact_texts = [f["fact"] for f in extracted_facts if f.get("fact")]
                if fact_texts:
                    vectors = await embed_texts(fact_texts, input_type="document")
                    await self.qdrant_store.upsert_facts(
                        tenant_id=tenant_id,
                        agent_id=agent_id,
                        facts=extracted_facts,
                        vectors=vectors,
                    )

            print(
                f"[MemoryService] Consolidated memory for agent {agent_id}. "
                f"New cutoff: {cutoff_seq}, Extracted facts: {len(extracted_facts)}",
                flush=True,
            )
            return {
                "status": "success",
                "updated_summary": new_summary,
                "facts_count": len(extracted_facts),
                "cutoff_seq": cutoff_seq,
            }
        except Exception as e:
            print(f"[MemoryService Error] Memory consolidation failed: {e}", flush=True)
            return {"status": "error", "error": str(e)}

    async def get_relevant_memory(
        self, tenant_id: str, agent_id: str, query: str
    ) -> Dict[str, Any]:
        agent_draft = await self.draft_repo.get_agent_draft(tenant_id, agent_id)
        summary = agent_draft.conversation_summary if agent_draft else ""

        relevant_facts: List[str] = []
        if query:
            try:
                query_vector = await embed_query(query)
                relevant_facts = await self.qdrant_store.search_relevant_facts(
                    query_vector=query_vector,
                    tenant_id=tenant_id,
                    agent_id=agent_id,
                    limit=3,
                )
            except Exception as qe:
                print(f"[MemoryService Warning] Qdrant search skipped: {qe}", flush=True)

        return {
            "conversation_summary": summary,
            "relevant_facts": relevant_facts,
        }
