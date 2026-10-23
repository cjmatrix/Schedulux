from __future__ import annotations

from typing import Any

from agent_orchestrator.domain.protocols import AgentOrchestrator
from agent_orchestrator.workflows.tenant_agent import (
    get_current_draft,
    resume_onboarding_session,
    start_onboarding_session,
)


class LangGraphAgentOrchestrator(AgentOrchestrator):
    async def start_session(
        self, tenant_id: str, initial_draft: dict[str, Any], agent_id: str
    ) -> dict[str, Any]:
        return await start_onboarding_session(tenant_id, initial_draft, agent_id)

    async def resume_session(
        self, tenant_id: str, user_answer: str, agent_id: str
    ) -> dict[str, Any]:
        return await resume_onboarding_session(tenant_id, user_answer, agent_id)

    async def get_current_draft(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None:
        return await get_current_draft(tenant_id, agent_id)
