from __future__ import annotations

from opentelemetry import trace

from agent_orchestrator.adapters.sqs_client import (
    extract_active_trace_context,
    resolve_queue_url,
    send_sqs_message,
)
from agent_orchestrator.config import AGENT_MEMORY_QUEUE_NAME
from agent_orchestrator.domain.protocols import MemoryQueue

tracer = trace.get_tracer("agent-orchestrator.memory-queue")


class SqsMemoryQueue(MemoryQueue):
    """MemoryQueue implementation backed by AWS SQS."""

    def __init__(self, queue_url: str | None = None) -> None:
        self._explicit_url = queue_url

    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None:
        queue_url = self._explicit_url or await resolve_queue_url(
            "AWS_SQS_MEMORY_QUEUE_URL",
            "AGENT_MEMORY_QUEUE_NAME",
            AGENT_MEMORY_QUEUE_NAME,
        )
        job_id = f"mem_{tenant_id}_{agent_id}_{cutoff_seq}"

        with tracer.start_as_current_span(
            "memory.consolidation.enqueue",
            kind=trace.SpanKind.PRODUCER,
            attributes={
                "messaging.system": "aws_sqs",
                "messaging.destination.name": AGENT_MEMORY_QUEUE_NAME,
                "messaging.operation": "publish",
                "tenant.id": tenant_id,
                "agent.id": agent_id,
                "memory.job_id": job_id,
                "memory.cutoff_seq": cutoff_seq,
            },
        ):
            trace_id, traceparent = extract_active_trace_context()
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
            await send_sqs_message(
                queue_url, payload, trace_id=trace_id, traceparent=traceparent
            )
            print(
                f"[SqsMemoryQueue] Enqueued memory job {job_id} for agent {agent_id} (cutoff: {cutoff_seq})",
                flush=True,
            )

    async def close(self) -> None:
        return None
