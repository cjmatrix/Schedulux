from __future__ import annotations

import secrets
from datetime import datetime
from typing import Any

from agent_orchestrator.domain.protocols import DraftRepository
from agent_orchestrator.models import AgentDraft, AgentDraftConfig


class MongoDraftRepository(DraftRepository):
    async def get_agent_draft(self, tenant_id: str, agent_id: str) -> AgentDraft | None:
        return await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})

    async def list_drafts(self, tenant_id: str) -> list[AgentDraft]:
        return await AgentDraft.find({"tenant_id": tenant_id}).to_list()

    async def upsert_agent_draft(
        self,
        tenant_id: str,
        agent_id: str,
        name: str,
        creation_source: str,
        draft_dict: dict[str, Any],
    ) -> AgentDraft:
        agent_draft = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
        config_obj = (
            AgentDraftConfig.model_validate(draft_dict) if draft_dict else AgentDraftConfig()
        )
        if not agent_draft:
            agent_draft = AgentDraft(
                tenant_id=tenant_id,
                agent_id=agent_id,
                name=name,
                creation_source=creation_source,
                current_draft=config_obj,
            )
            agent_draft.add_checkpoint(
                checkpoint_id=f"cp_{secrets.token_hex(4)}",
                message_id="initial_creation",
                user_prompt=f"Initial agent creation ({creation_source})",
                summary=f"Created agent draft from {creation_source}",
                draft_snapshot=config_obj,
            )
            await agent_draft.save()
        else:
            agent_draft.name = name
            agent_draft.creation_source = creation_source
            agent_draft.current_draft = config_obj
            agent_draft.updated_at = datetime.utcnow()
            agent_draft.add_checkpoint(
                checkpoint_id=f"cp_{secrets.token_hex(4)}",
                message_id="update_draft",
                user_prompt=f"Updated draft ({creation_source})",
                summary=f"Updated draft snapshot ({creation_source})",
                draft_snapshot=config_obj,
            )
            await agent_draft.save()

        return agent_draft
