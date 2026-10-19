from __future__ import annotations

from typing import Protocol, Optional, List, Tuple, Dict, Any
from datetime import datetime
from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig, AgentMessage


class MessageRepository(Protocol):
    async def get_messages(
        self, tenant_id: str, agent_id: str, before: Optional[datetime], limit: int
    ) -> Tuple[List[AgentMessage], bool, Optional[str]]:
        ...

    async def save_message(
        self, tenant_id: str, agent_id: str, role: str, content: str
    ) -> AgentMessage:
        ...

    async def count_messages(self, tenant_id: str, agent_id: str) -> int:
        ...

    async def get_latest_agent_message(
        self, tenant_id: str, agent_id: str
    ) -> Optional[AgentMessage]:
        ...


class DraftRepository(Protocol):
    async def get_agent_draft(self, tenant_id: str, agent_id: str) -> Optional[AgentDraft]:
        ...

    async def list_drafts(self, tenant_id: str) -> List[AgentDraft]:
        ...

    async def upsert_agent_draft(
        self,
        tenant_id: str,
        agent_id: str,
        name: str,
        creation_source: str,
        draft_dict: Dict[str, Any],
    ) -> AgentDraft:
        ...


class RuntimeConfigRepository(Protocol):
    async def get_runtime_config(self, tenant_id: str, agent_id: str) -> Optional[AgentRuntimeConfig]:
        ...

    async def list_runtime_configs(self, tenant_id: str) -> List[AgentRuntimeConfig]:
        ...


class CacheRepository(Protocol):
    async def get_cached_draft(self, tenant_id: str, agent_id: str) -> Optional[Dict[str, Any]]:
        ...

    async def set_cached_draft(self, tenant_id: str, agent_id: str, draft: Dict[str, Any]) -> None:
        ...

    async def get_raw_crawl_draft(self, tenant_id: str) -> Optional[str]:
        ...


class CrawlerQueue(Protocol):
    async def enqueue_crawl(self, tenant_id: str, url: str, job_id: str) -> None:
        ...

    async def get_crawl_job(self, job_id: str) -> Tuple[Optional[str], int, List[Dict[str, Any]]]:
        ...

    async def close(self) -> None:
        ...


class MemoryQueue(Protocol):
    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None:
        ...

    async def close(self) -> None:
        ...


class AgentOrchestrator(Protocol):
    async def start_session(
        self, tenant_id: str, initial_draft: Dict[str, Any], agent_id: str
    ) -> Dict[str, Any]:
        ...

    async def resume_session(
        self, tenant_id: str, user_answer: str, agent_id: str
    ) -> Dict[str, Any]:
        ...

    async def get_current_draft(
        self, tenant_id: str, agent_id: str
    ) -> Optional[Dict[str, Any]]:
        ...
