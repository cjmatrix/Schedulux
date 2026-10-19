from __future__ import annotations

import asyncio
import os
from bullmq import Worker
from agent_orchestrator.config import AGENT_MEMORY_QUEUE_NAME
from agent_orchestrator.services.memory_service import MemoryService
from agent_orchestrator.repositories.message_repository import MongoMessageRepository
from agent_orchestrator.repositories.draft_repository import MongoDraftRepository
from agent_orchestrator.repositories.memory_queue import BullMQMemoryQueue


async def process_memory_job(job, job_token):
    data = job.data or {}
    tenant_id = data.get("tenant_id")
    agent_id = data.get("agent_id")
    cutoff_seq = data.get("cutoff_seq", 0)

    if not tenant_id or not agent_id:
        return {"status": "skipped", "reason": "missing_ids"}

    print(f"[MemoryWorker] Processing job {job.id} for agent {agent_id} (cutoff: {cutoff_seq})", flush=True)
    msg_repo = MongoMessageRepository()
    draft_repo = MongoDraftRepository()
    queue = BullMQMemoryQueue()
    memory_service = MemoryService(msg_repo, draft_repo, queue)

    result = await memory_service.consolidate_memory(tenant_id, agent_id, cutoff_seq)
    print(f"[MemoryWorker] Completed job {job.id}: {result.get('status')}", flush=True)
    return result


async def run_memory_worker():
    redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")
    print(f"[MemoryWorker] Starting BullMQ worker for queue '{AGENT_MEMORY_QUEUE_NAME}'...", flush=True)

    worker = Worker(
        AGENT_MEMORY_QUEUE_NAME,
        process_memory_job,
        {
            "connection": redis_uri,
            "concurrency": 2,
        },
    )

    try:
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        print("[MemoryWorker] Shutting down worker gracefully...", flush=True)
        await worker.close()
