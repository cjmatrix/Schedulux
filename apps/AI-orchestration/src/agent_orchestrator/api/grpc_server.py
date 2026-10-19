from __future__ import annotations

import os
import sys
import asyncio
import grpc
from dotenv import load_dotenv


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import agent_orchestrator.knowledge_pb2_grpc as knowledge_pb2_grpc
from agent_orchestrator.models import init_db
from agent_orchestrator.repositories.message_repository import MongoMessageRepository
from agent_orchestrator.repositories.draft_repository import MongoDraftRepository
from agent_orchestrator.repositories.runtime_config_repository import MongoRuntimeConfigRepository
from agent_orchestrator.repositories.cache_repository import RedisCacheRepository
from agent_orchestrator.repositories.crawler_queue import BullMQCrawlerQueue
from agent_orchestrator.repositories.orchestrator_adapter import LangGraphAgentOrchestrator
from agent_orchestrator.services.onboarding_service import OnboardingService
from agent_orchestrator.services.chat_service import ChatService
from agent_orchestrator.services.agent_service import AgentManagementService
from agent_orchestrator.services.crawler_service import CrawlerService
from agent_orchestrator.api.servicers.knowledge_servicer import KnowledgeServiceServicer

local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(local_env)


from agent_orchestrator.repositories.memory_queue import BullMQMemoryQueue
from agent_orchestrator.services.memory_service import MemoryService


def build_knowledge_servicer() -> tuple[KnowledgeServiceServicer, CrawlerService, BullMQMemoryQueue]:
    msg_repo = MongoMessageRepository()
    draft_repo = MongoDraftRepository()
    runtime_repo = MongoRuntimeConfigRepository()
    cache_repo = RedisCacheRepository()
    crawler_queue = BullMQCrawlerQueue()
    memory_queue = BullMQMemoryQueue()
    orchestrator = LangGraphAgentOrchestrator()

    memory_service = MemoryService(
        message_repo=msg_repo,
        draft_repo=draft_repo,
        memory_queue=memory_queue,
    )

    onboarding_service = OnboardingService(
        draft_repo=draft_repo,
        runtime_repo=runtime_repo,
        cache_repo=cache_repo,
        message_repo=msg_repo,
        orchestrator=orchestrator,
        memory_service=memory_service,
    )
    chat_service = ChatService(message_repo=msg_repo)
    agent_service = AgentManagementService(
        draft_repo=draft_repo,
        runtime_repo=runtime_repo,
        cache_repo=cache_repo,
    )
    crawler_service = CrawlerService(queue=crawler_queue)

    servicer = KnowledgeServiceServicer(
        onboarding_service=onboarding_service,
        chat_service=chat_service,
        agent_service=agent_service,
        crawler_service=crawler_service,
    )
    return servicer, crawler_service, memory_queue


async def serve():
    await init_db()
    server = grpc.aio.server()
    servicer, crawler_service, memory_queue = build_knowledge_servicer()
    knowledge_pb2_grpc.add_KnowledgeServiceServicer_to_server(servicer, server)

    port = os.environ.get("PORT", "50052")
    server.add_insecure_port(f"[::]:{port}")
    print(f"Starting native Async gRPC server on port {port}...", flush=True)
    await server.start()

    try:
        await server.wait_for_termination()
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        print("[AI Orchestrator Service] Shutting down gRPC server...", flush=True)
        await server.stop(grace=1.0)
        await crawler_service.close()
        await memory_queue.close()


if __name__ == "__main__":
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        print("gRPC Server terminated by user.")
