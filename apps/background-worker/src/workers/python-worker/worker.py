import asyncio
import json
import os
import signal
import sys
import aio_pika
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from python_worker.crawler import process_crawl_job
from python_worker.schema_generator import process_schema_generation
from python_worker.document_indexer import process_document_indexing
from python_worker.queues import (
    close_all_connections,
    CRAWL_QUEUE_NAME,
    SCHEMA_QUEUE_NAME,
    DOCUMENT_INDEXING_QUEUE_NAME,
    DOCUMENT_STATUS_QUEUE_NAME,
)

rabbitmq_uri = os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672")


async def handle_crawl_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process():
        data = json.loads(message.body.decode())
        await process_crawl_job(data)


async def handle_schema_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process():
        data = json.loads(message.body.decode())
        await process_schema_generation(data)


async def handle_indexing_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process():
        data = json.loads(message.body.decode())
        await process_document_indexing(data)


async def main():
    print("[Python Worker] Starting RabbitMQ background workers...", flush=True)
    print(f"[Python Worker] Connecting to RabbitMQ: {rabbitmq_uri}", flush=True)

    connection = await aio_pika.connect_robust(rabbitmq_uri)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)

    crawl_queue = await channel.declare_queue(CRAWL_QUEUE_NAME, durable=True)
    schema_queue = await channel.declare_queue(SCHEMA_QUEUE_NAME, durable=True)
    indexing_queue = await channel.declare_queue(DOCUMENT_INDEXING_QUEUE_NAME, durable=True)

    await crawl_queue.consume(handle_crawl_message)
    await schema_queue.consume(handle_schema_message)
    await indexing_queue.consume(handle_indexing_message)

    stop_event = asyncio.Event()

    def shutdown_handler():
        print("\n[Python Worker] Shutting down workers gracefully...", flush=True)
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    print(
        f"[Python Worker] Listening on RabbitMQ queues '{CRAWL_QUEUE_NAME}', '{SCHEMA_QUEUE_NAME}', and '{DOCUMENT_INDEXING_QUEUE_NAME}'...",
        flush=True,
    )
    await stop_event.wait()

    await channel.close()
    await connection.close()
    await close_all_connections()
    print("[Python Worker] All background workers and connections closed gracefully.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())