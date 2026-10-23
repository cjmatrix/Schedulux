from __future__ import annotations

import copy
import json
from typing import Any

from agent_orchestrator.domain.exceptions import AgentNotFoundException
from agent_orchestrator.domain.protocols import (
    AgentOrchestrator,
    CacheRepository,
    DraftRepository,
    MessageRepository,
    RuntimeConfigRepository,
)
from agent_orchestrator.models import AgentRuntimeConfig, canonicalize_agent_schema
from agent_orchestrator.services.protocols import (
    MemoryServiceProtocol,
    OnboardingResult,
    OnboardingServiceProtocol,
)


class OnboardingService(OnboardingServiceProtocol):
    def __init__(
        self,
        draft_repo: DraftRepository,
        runtime_repo: RuntimeConfigRepository,
        cache_repo: CacheRepository,
        message_repo: MessageRepository,
        orchestrator: AgentOrchestrator,
        memory_service: MemoryServiceProtocol | None = None,
    ):
        self.draft_repo = draft_repo
        self.runtime_repo = runtime_repo
        self.cache_repo = cache_repo
        self.message_repo = message_repo
        self.orchestrator = orchestrator
        self.memory_service = memory_service

    def _format_runtime_config(self, runtime_cfg: AgentRuntimeConfig | None) -> dict[str, Any]:
        if not runtime_cfg:
            return {}
        return canonicalize_agent_schema(runtime_cfg.model_dump(), status="live")

    async def start_session(
        self, tenant_id: str, agent_id: str, initial_draft_json: str | None = None
    ) -> OnboardingResult:
        if not agent_id:
            raise AgentNotFoundException("agent_id is required to start onboarding session")

        initial_draft: dict[str, Any] | None = await self.cache_repo.get_cached_draft(
            tenant_id, agent_id
        )

        if not initial_draft:
            agent_draft_doc = await self.draft_repo.get_agent_draft(tenant_id, agent_id)
            if agent_draft_doc and agent_draft_doc.current_draft:
                initial_draft = dict(agent_draft_doc.current_draft)
                if agent_draft_doc.status in ("complete", "created") and initial_draft.get(
                    "status"
                ) not in (
                    "complete",
                    "created",
                    "live",
                ):
                    initial_draft["status"] = agent_draft_doc.status
            elif initial_draft_json and initial_draft_json.strip() not in ("", "{}"):
                try:
                    initial_draft = json.loads(initial_draft_json)
                except Exception:
                    initial_draft = None

            if not initial_draft:
                live_cfg = await self.runtime_repo.get_runtime_config(tenant_id, agent_id)
                if live_cfg:
                    initial_draft = copy.deepcopy(self._format_runtime_config(live_cfg))

            if not initial_draft:
                raise AgentNotFoundException(f"Agent draft not found for agent_id: {agent_id}")

            try:
                await self.cache_repo.set_cached_draft(tenant_id, agent_id, initial_draft)
            except Exception as ce:
                print(f"[OnboardingService] Warning: Cache warm failed: {ce}", flush=True)

        existing_status = str(initial_draft.get("status") or "draft")
        is_completed = existing_status in ("complete", "created", "live")

        initial_draft["agent_id"] = agent_id
        initial_draft["tenant_id"] = tenant_id
        initial_draft = canonicalize_agent_schema(initial_draft, status=existing_status)

        if is_completed:
            live_cfg = await self.runtime_repo.get_runtime_config(tenant_id, agent_id)
            live_schema_json = json.dumps(self._format_runtime_config(live_cfg))
        else:
            live_schema_json = "{}"

        draft_json = json.dumps(initial_draft)

        msg_count = await self.message_repo.count_messages(tenant_id, agent_id)

        if msg_count > 0 or is_completed:
            last_msg = await self.message_repo.get_latest_agent_message(tenant_id, agent_id)
            question = (
                last_msg.content
                if last_msg
                else "Configuration loaded. What would you like to update?"
            )
            return OnboardingResult(
                status="complete" if is_completed else "awaiting_input",
                question=question,
                field="",
                type="",
                draft_schema_json=draft_json,
                live_schema_json=live_schema_json,
            )

        payload = await self.orchestrator.start_session(tenant_id, initial_draft, agent_id)

        question = payload.get("question") or ""
        if question:
            try:
                await self.message_repo.save_message(
                    tenant_id=tenant_id, agent_id=agent_id, role="agent", content=question
                )
            except Exception as me:
                print(
                    f"[OnboardingService] Warning: Failed to persist initial prompt: {me}",
                    flush=True,
                )

        return OnboardingResult(
            status=payload.get("status", "error"),
            question=question,
            field=payload.get("field") or "",
            type=payload.get("type") or "",
            draft_schema_json=draft_json,
            live_schema_json=live_schema_json,
        )

    async def resume_session(
        self, tenant_id: str, agent_id: str, user_answer: str
    ) -> OnboardingResult:
        clean_user_msg = (user_answer or "").strip()
        if clean_user_msg and agent_id:
            try:
                await self.message_repo.save_message(
                    tenant_id=tenant_id, agent_id=agent_id, role="tenant", content=clean_user_msg
                )
            except Exception as me:
                print(
                    f"[OnboardingService] Warning: Failed to persist user answer: {me}", flush=True
                )

        payload = await self.orchestrator.resume_session(tenant_id, user_answer, agent_id)
        current_draft = await self.orchestrator.get_current_draft(tenant_id, agent_id)
        canonical_draft = canonicalize_agent_schema(current_draft or {}, status="draft")
        draft_json = json.dumps(canonical_draft)

        is_complete = payload.get("status") == "complete"
        if is_complete:
            live_schema_json = json.dumps(canonicalize_agent_schema(canonical_draft, status="live"))
        else:
            live_cfg = (
                await self.runtime_repo.get_runtime_config(tenant_id, agent_id)
                if agent_id
                else None
            )
            live_schema_json = json.dumps(self._format_runtime_config(live_cfg))

        reply_text = payload.get("question") or (
            "✅ Amazing! Your agent configuration is complete and saved to the database. You are ready to go live!"
            if is_complete
            else ""
        )
        if reply_text and agent_id:
            try:
                await self.message_repo.save_message(
                    tenant_id=tenant_id, agent_id=agent_id, role="agent", content=reply_text
                )
            except Exception as me:
                print(
                    f"[OnboardingService] Warning: Failed to persist agent reply: {me}", flush=True
                )

        if self.memory_service and agent_id:
            try:
                await self.memory_service.check_and_trigger_memory(tenant_id, agent_id)
            except Exception as mem_err:
                print(
                    f"[OnboardingService Warning] Memory trigger check failed: {mem_err}",
                    flush=True,
                )

        return OnboardingResult(
            status=payload.get("status", "error"),
            question=payload.get("question") or "",
            field=payload.get("field") or "",
            type=payload.get("type") or "",
            draft_schema_json=draft_json,
            live_schema_json=live_schema_json,
        )
