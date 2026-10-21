from __future__ import annotations

import asyncio
import json
import os

import aio_pika

from agent_orchestrator.config import AGENT_MEMORY_QUEUE_NAME
from agent_orchestrator.queues.memory_queue import RabbitMQMemoryQueue
from agent_orchestrator.repositories.draft_repository import MongoDraftRepository
from agent_orchestrator.repositories.message_repository import MongoMessageRepository
from agent_orchestrator.services.memory_service import MemoryService


async def handle_memory_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            tenant_id = data.get("tenant_id")
            agent_id = data.get("agent_id")
            cutoff_seq = data.get("cutoff_seq", 0)
            job_id = data.get("job_id", message.message_id or "unknown")

            if not tenant_id or not agent_id:
                print(f"[MemoryWorker] Skipping invalid memory job: {data}", flush=True)
                return

            print(
                f"[MemoryWorker] Processing job {job_id} for agent {agent_id} (cutoff: {cutoff_seq})",
                flush=True,
            )
            msg_repo = MongoMessageRepository()
            draft_repo = MongoDraftRepository()
            queue = RabbitMQMemoryQueue()
            memory_service = MemoryService(msg_repo, draft_repo, queue)

            result = await memory_service.consolidate_memory(tenant_id, agent_id, cutoff_seq)
            print(f"[MemoryWorker] Completed job {job_id}: {result.get('status')}", flush=True)
        except Exception as e:
            print(f"[MemoryWorker] Error processing memory message: {e}", flush=True)
            raise


async def run_memory_worker():
    rabbitmq_uri = os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672")
    print(f"[MemoryWorker] Connecting to RabbitMQ at {rabbitmq_uri}...", flush=True)

    connection = await aio_pika.connect_robust(rabbitmq_uri)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=2)

    queue = await channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True)
    print(
        f"[MemoryWorker] Listening for memory consolidation jobs on '{AGENT_MEMORY_QUEUE_NAME}'...",
        flush=True,
    )

    await queue.consume(handle_memory_message)

    try:
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        print("[MemoryWorker] Shutting down memory worker gracefully...", flush=True)
    finally:
        await channel.close()
        await connection.close()
