from __future__ import annotations

import os
import urllib.parse

from beanie import init_beanie
from pymongo import AsyncMongoClient

_client: AsyncMongoClient | None = None
_db_initialized = False


def get_mongo_client() -> AsyncMongoClient | None:
    return _client


async def init_db(mongo_uri: str | None = None):
    global _client, _db_initialized
    if _db_initialized:
        return
    if mongo_uri is None:
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/schedulux_ai")

    parsed = urllib.parse.urlparse(mongo_uri)
    db_name = parsed.path.lstrip("/") if parsed.path else ""
    if not db_name or "?" in db_name:
        db_name = db_name.split("?")[0] if db_name else ""
    if not db_name:
        db_name = "schedulux_ai"

    _client = AsyncMongoClient(mongo_uri)
    db = _client[db_name]

    from agent_orchestrator.models.agent_drafts import AgentDraft
    from agent_orchestrator.models.agent_messages import AgentMessage
    from agent_orchestrator.models.agent_runtime_configs import AgentRuntimeConfig
    from agent_orchestrator.models.customer_conversations import CustomerConversation
    from agent_orchestrator.models.customer_messages import CustomerMessage
    from agent_orchestrator.models.knowledge_documents import KnowledgeDocument
    from agent_orchestrator.models.outbox_events import OutboxEvent

    await init_beanie(
        database=db,
        document_models=[
            AgentDraft,
            AgentRuntimeConfig,
            AgentMessage,
            CustomerConversation,
            CustomerMessage,
            KnowledgeDocument,
            OutboxEvent,
        ],
    )
    _db_initialized = True
