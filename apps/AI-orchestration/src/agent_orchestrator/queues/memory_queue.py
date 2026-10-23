from __future__ import annotations

import json
import os

import aio_pika

from agent_orchestrator.config import AGENT_MEMORY_QUEUE_NAME
from agent_orchestrator.domain.protocols import MemoryQueue


class RabbitMQMemoryQueue(MemoryQueue):
    def __init__(self, rabbitmq_uri: str | None = None):
        self.uri = rabbitmq_uri or os.environ.get(
            "RABBITMQ_URI", "amqp://guest:guest@localhost:5672"
        )
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None

    async def _get_channel(self) -> aio_pika.abc.AbstractChannel:
        if self._connection is None or self._connection.is_closed:
            self._connection = await aio_pika.connect_robust(self.uri)
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True)
        elif self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True)
        return self._channel

    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None:
        channel = await self._get_channel()
        job_id = f"mem_{tenant_id}_{agent_id}_{cutoff_seq}"
        payload = {
            "name": "consolidate_memory",
            "job_id": job_id,
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "total_count": total_count,
            "cutoff_seq": cutoff_seq,
        }

        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                message_id=job_id,
            ),
            routing_key=AGENT_MEMORY_QUEUE_NAME,
        )
        print(
            f"[RabbitMQMemoryQueue] Enqueued memory job {job_id} for agent {agent_id} (cutoff: {cutoff_seq})",
            flush=True,
        )

    async def close(self) -> None:
        try:
            if self._channel and not self._channel.is_closed:
                await self._channel.close()
            if self._connection and not self._connection.is_closed:
                await self._connection.close()
        except Exception:
            pass


# Backwards compatibility alias
BullMQMemoryQueue = RabbitMQMemoryQueue
