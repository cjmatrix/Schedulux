import asyncio

from agent_orchestrator.api.grpc_server import serve
from agent_orchestrator.models import init_db
from agent_orchestrator.workers.document_status_consumer import run_document_status_consumer
from agent_orchestrator.workers.memory_worker import run_memory_worker
from agent_orchestrator.workers.scheduling_consumer import run_consumer


def main():
    print(
        
        flush=True,
    )
    try:
        asyncio.run(_run_all())
    except KeyboardInterrupt:
        print("[AI Orchestrator Service] Shutting down gracefully.", flush=True)


async def _run_all():
   
    await init_db()

    grpc_task = asyncio.create_task(serve(), name="grpc-server")
    consumer_task = asyncio.create_task(run_consumer(), name="scheduling-consumer")
    memory_task = asyncio.create_task(run_memory_worker(), name="memory-worker")
    doc_status_task = asyncio.create_task(
        run_document_status_consumer(), name="doc-status-consumer"
    )

    done, pending = await asyncio.wait(
        [grpc_task, consumer_task, memory_task, doc_status_task],
        return_when=asyncio.FIRST_EXCEPTION,
    )

    for task in done:
        exc = task.exception()
        if exc:
            print(f"[AI Orchestrator] Task {task.get_name()} raised: {exc}", flush=True)

    for task in pending:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


if __name__ == "__main__":
    main()
