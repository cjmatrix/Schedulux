from __future__ import annotations

import asyncio
from agent_orchestrator.api.grpc_server import serve, build_knowledge_servicer
from agent_orchestrator.api.servicers.knowledge_servicer import KnowledgeServiceServicer

__all__ = [
    "serve",
    "build_knowledge_servicer",
    "KnowledgeServiceServicer",
]

if __name__ == "__main__":
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        print("gRPC Server terminated by user.")