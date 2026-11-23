from __future__ import annotations

import asyncio
import json
import logging
import os
import random
from typing import Any, Callable

import aio_pika
from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

from agent_orchestrator.adapters.qdrant_stores import QdrantMemoryStore
from agent_orchestrator.adapters.voyage_embedder import VoyageDenseEmbedder
from agent_orchestrator.config import AGENT_MEMORY_DLQ_NAME, AGENT_MEMORY_QUEUE_NAME
from agent_orchestrator.domain.exceptions import PermanentMemoryError
from agent_orchestrator.queues.memory_queue import RabbitMQMemoryQueue
from agent_orchestrator.repositories.draft_repository import MongoDraftRepository
from agent_orchestrator.repositories.message_repository import MongoMessageRepository
from agent_orchestrator.services.memory_service import MemoryService

logger = logging.getLogger("memory-worker")
tracer = trace.get_tracer("agent-orchestrator.memory-worker")


async def async_retry_with_backoff(
    coro_fn: Callable[..., Any],
    *args: Any,
    max_retries: int = 3,
    initial_delay: float = 1.5,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    operation_name: str = "Operation",
    **kwargs: Any,
) -> Any:
    """Retries a coroutine function with exponential backoff and jitter.

    Permanent errors (PermanentMemoryError, 401 Unauthorized) fast-fail immediately without retry.
    """
    last_exc: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return await coro_fn(*args, **kwargs)
        except PermanentMemoryError:
            raise
        except Exception as exc:
            last_exc = exc
            err_str = str(exc).lower()
            err_type = type(exc).__name__

            if (
                "401" in err_str
                or "unauthorized" in err_str
                or "authenticationerror" in err_type.lower()
                or "invalid api key" in err_str
            ):
                raise PermanentMemoryError(f"Permanent auth error ({err_type}): {exc}") from exc

            if attempt == max_retries:
                logger.error(
                    f"[MemoryWorker] {operation_name} exhausted all {max_retries} attempts. Failing job: {exc}"
                )
                raise

            delay = initial_delay * (backoff_factor ** (attempt - 1))
            if jitter:
                delay += random.uniform(0.1, 0.5)

            logger.warning(
                f"[MemoryWorker] {operation_name} transient error on attempt {attempt}/{max_retries} "
                f"({err_type}: {exc}). Retrying in {delay:.2f}s..."
            )
            await asyncio.sleep(delay)

    if last_exc:
        raise last_exc


async def handle_memory_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process(requeue=False):
        try:
            body_raw = message.body.decode()
            data = json.loads(body_raw)
        except Exception as parse_err:
            logger.error(f"[MemoryWorker] Poison pill - Malformed JSON body: {parse_err}")
            raise PermanentMemoryError(f"Malformed JSON: {parse_err}") from parse_err

        tenant_id = data.get("tenant_id")
        agent_id = data.get("agent_id")
        cutoff_seq = data.get("cutoff_seq", 0)
        job_id = data.get("job_id", message.message_id or "unknown")

        headers = message.headers or {}
        traceparent = headers.get("traceparent") or data.get("traceparent")
        parent_ctx = None
        if traceparent:
            parent_ctx = TraceContextTextMapPropagator().extract({"traceparent": traceparent})

        with tracer.start_as_current_span(
            "memory.consolidation.process",
            context=parent_ctx,
            kind=trace.SpanKind.CONSUMER,
            attributes={
                "messaging.system": "rabbitmq",
                "messaging.destination.name": AGENT_MEMORY_QUEUE_NAME,
                "messaging.operation": "process",
                "tenant.id": tenant_id or "unknown",
                "agent.id": agent_id or "unknown",
                "memory.job_id": job_id,
                "memory.cutoff_seq": cutoff_seq,
            },
        ) as consumer_span:
            if not tenant_id or not agent_id:
                logger.error(f"[MemoryWorker] Poison pill - Missing tenant_id or agent_id: {data}")
                raise PermanentMemoryError(f"Missing tenant_id or agent_id in job {job_id}")

            logger.info(
                f"[MemoryWorker] Processing job {job_id} for agent {agent_id} (cutoff: {cutoff_seq})"
            )
            print(
                f"[MemoryWorker] Processing job {job_id} for agent {agent_id} (cutoff: {cutoff_seq})",
                flush=True,
            )

            msg_repo = MongoMessageRepository()
            draft_repo = MongoDraftRepository()
            queue = RabbitMQMemoryQueue()
            memory_service = MemoryService(
                message_repo=msg_repo,
                draft_repo=draft_repo,
                memory_queue=queue,
                dense_embedder=VoyageDenseEmbedder(),
                memory_store=QdrantMemoryStore(),
            )

            try:
                result = await async_retry_with_backoff(
                    memory_service.consolidate_memory,
                    tenant_id,
                    agent_id,
                    cutoff_seq,
                    max_retries=3,
                    initial_delay=1.5,
                    operation_name=f"ConsolidateMemory({job_id})",
                )
                consumer_span.set_attribute("memory.status", result.get("status", "success"))
                print(f"[MemoryWorker] Completed job {job_id}: {result.get('status')}", flush=True)
            except PermanentMemoryError as p_err:
                consumer_span.record_exception(p_err)
                consumer_span.set_attribute("error", True)
                print(
                    f"[MemoryWorker] Permanent failure for job {job_id} -> routing to DLQ: {p_err}",
                    flush=True,
                )
                raise
            except Exception as transient_err:
                consumer_span.record_exception(transient_err)
                consumer_span.set_attribute("error", True)
                print(
                    f"[MemoryWorker] Exhausted retries for job {job_id} -> routing to DLQ: {transient_err}",
                    flush=True,
                )
                raise


async def run_memory_worker():
    rabbitmq_uri = os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672")
    print(f"[MemoryWorker] Connecting to RabbitMQ at {rabbitmq_uri}...", flush=True)

    connection = await aio_pika.connect_robust(rabbitmq_uri)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=2)

    memory_args = {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": AGENT_MEMORY_DLQ_NAME,
    }
    await channel.declare_queue(AGENT_MEMORY_DLQ_NAME, durable=True)
    try:
        queue = await channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True, arguments=memory_args)
    except aio_pika.exceptions.ChannelPreconditionFailed:
        channel = await connection.channel()
        await channel.queue_delete(AGENT_MEMORY_QUEUE_NAME)
        queue = await channel.declare_queue(AGENT_MEMORY_QUEUE_NAME, durable=True, arguments=memory_args)

    print(
        f"[MemoryWorker] Listening for memory consolidation jobs on '{AGENT_MEMORY_QUEUE_NAME}' (DLQ: '{AGENT_MEMORY_DLQ_NAME}')...",
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
