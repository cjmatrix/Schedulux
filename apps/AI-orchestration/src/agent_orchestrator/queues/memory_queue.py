from __future__ import annotations

import json
import os

import aio_pika
from opentelemetry import trace

from agent_orchestrator.config import AGENT_MEMORY_DLQ_NAME, AGENT_MEMORY_QUEUE_NAME
from agent_orchestrator.domain.protocols import MemoryQueue

tracer = trace.get_tracer("agent-orchestrator.memory-queue")


class RabbitMQMemoryQueue(MemoryQueue):
    def __init__(self, rabbitmq_uri: str | None = None):
        self.uri = rabbitmq_uri or os.environ.get(
            "RABBITMQ_URI", "amqp://guest:guest@localhost:5672"
        )
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None

    async def _declare_queues(self, channel: aio_pika.abc.AbstractChannel) -> None:
        memory_args = {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": AGENT_MEMORY_DLQ_NAME,
        }
        await channel.declare_queue(AGENT_MEMORY_DLQ_NAME, durable=True)
        try:
            await channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True, arguments=memory_args)
        except aio_pika.exceptions.ChannelPreconditionFailed:
            if self._connection and not self._connection.is_closed:
                new_channel = await self._connection.channel()
                await new_channel.queue_delete(AGENT_MEMORY_QUEUE_NAME)
                await new_channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True, arguments=memory_args)
                self._channel = new_channel

    async def _get_channel(self) -> aio_pika.abc.AbstractChannel:
        if self._connection is None or self._connection.is_closed:
            self._connection = await aio_pika.connect_robust(self.uri)
            self._channel = await self._connection.channel()
            await self._declare_queues(self._channel)
        elif self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            await self._declare_queues(self._channel)
        return self._channel

    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None:
        channel = await self._get_channel()
        job_id = f"mem_{tenant_id}_{agent_id}_{cutoff_seq}"

        with tracer.start_as_current_span(
            "memory.consolidation.enqueue",
            kind=trace.SpanKind.PRODUCER,
            attributes={
                "messaging.system": "rabbitmq",
                "messaging.destination.name": AGENT_MEMORY_QUEUE_NAME,
                "messaging.operation": "publish",
                "tenant.id": tenant_id,
                "agent.id": agent_id,
                "memory.job_id": job_id,
                "memory.cutoff_seq": cutoff_seq,
            },
        ) as producer_span:
            ctx = producer_span.get_span_context()
            trace_id = format(ctx.trace_id, "032x") if ctx.is_valid else None
            traceparent = (
                f"00-{trace_id}-{format(ctx.span_id, '016x')}-{ctx.trace_flags:02x}"
                if ctx.is_valid
                else None
            )

            headers: dict[str, str] = {}
            if traceparent:
                headers["traceparent"] = traceparent
            if trace_id:
                headers["trace_id"] = trace_id

            payload = {
                "name": "consolidate_memory",
                "job_id": job_id,
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "total_count": total_count,
                "cutoff_seq": cutoff_seq,
                "traceparent": traceparent,
                "trace_id": trace_id,
            }

            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                    message_id=job_id,
                    headers=headers,
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


BullMQMemoryQueue = RabbitMQMemoryQueue
