from __future__ import annotations

from typing import Optional, Dict, Any
from agent_orchestrator.tenant_agent import (
    start_onboarding_session,
    resume_onboarding_session,
    get_current_draft,
)


class LangGraphAgentOrchestrator:
    async def start_session(
        self, tenant_id: str, initial_draft: Dict[str, Any], agent_id: str
    ) -> Dict[str, Any]:
        return await start_onboarding_session(tenant_id, initial_draft, agent_id)

    async def resume_session(
        self, tenant_id: str, user_answer: str, agent_id: str
    ) -> Dict[str, Any]:
        return await resume_onboarding_session(tenant_id, user_answer, agent_id)

    async def get_current_draft(
        self, tenant_id: str, agent_id: str
    ) -> Optional[Dict[str, Any]]:
        return await get_current_draft(tenant_id, agent_id)
