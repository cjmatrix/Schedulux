import asyncio
from agent_orchestrator.grpc_server import serve
from agent_orchestrator.scheduling_consumer import run_consumer


def main():
    print("[AI Orchestrator Service] Starting gRPC server + Kafka consumer...", flush=True)
    try:
        asyncio.run(_run_all())
    except KeyboardInterrupt:
        print("[AI Orchestrator Service] Shutting down gracefully.", flush=True)


async def _run_all():
    """Run gRPC server and Kafka consumer concurrently."""
    grpc_task     = asyncio.create_task(serve(),        name="grpc-server")
    consumer_task = asyncio.create_task(run_consumer(), name="kafka-consumer")

    done, pending = await asyncio.wait(
        [grpc_task, consumer_task],
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
