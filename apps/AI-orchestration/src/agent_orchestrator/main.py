import asyncio
import os

from agent_orchestrator.adapters import KafkaEventSubscriber, RabbitMQEventSubscriber
from agent_orchestrator.api.grpc_server import serve
from agent_orchestrator.models import init_db
from agent_orchestrator.repositories.document_repository import MongoDocumentRepository
from agent_orchestrator.workers.document_status_consumer import DocumentStatusConsumer
from agent_orchestrator.workers.memory_worker import run_memory_worker
from agent_orchestrator.workers.scheduling_consumer import SchedulingConsumer


def main():
    print(
        "[AI Orchestrator Service] Starting gRPC server + Scheduling consumer (Kafka) + Memory worker + Document status consumer (RabbitMQ)...",
        flush=True,
    )
    try:
        asyncio.run(_run_all())
    except KeyboardInterrupt:
        print("[AI Orchestrator Service] Shutting down gracefully.", flush=True)


async def _run_all():

    await init_db()

    kafka_subscriber = KafkaEventSubscriber(
        brokers=os.environ.get("KAFKA_BROKERS", "localhost:9092"),
        group_id=os.environ.get("KAFKA_CONSUMER_GROUP", "ai-orchestration-consumer-group"),
        username=os.environ.get("KAFKA_USERNAME", ""),
        password=os.environ.get("KAFKA_PASSWORD", ""),
    )
    scheduling_consumer = SchedulingConsumer(subscriber=kafka_subscriber)

    rabbitmq_subscriber = RabbitMQEventSubscriber(
        uri=os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672"),
        prefetch_count=5,
    )
    document_repo = MongoDocumentRepository()
    doc_status_consumer = DocumentStatusConsumer(
        subscriber=rabbitmq_subscriber,
        document_repo=document_repo,
    )

    grpc_task = asyncio.create_task(serve(), name="grpc-server")
    consumer_task = asyncio.create_task(scheduling_consumer.start(), name="scheduling-consumer")
    memory_task = asyncio.create_task(run_memory_worker(), name="memory-worker")
    doc_status_task = asyncio.create_task(doc_status_consumer.start(), name="doc-status-consumer")

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
