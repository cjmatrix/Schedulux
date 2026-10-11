import asyncio
import os
import signal
import sys
from bullmq import Worker
from dotenv import load_dotenv


sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from python_worker.crawler import process_crawl_job
from python_worker.schema_generator import process_schema_generation
from python_worker.queues import close_all_connections


dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '.env')
load_dotenv(dotenv_path)

redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")

async def main():
    print("[Python Worker] Starting background workers...", flush=True)
    print(f"[Python Worker] Connecting to Redis: {redis_uri}", flush=True)

    crawler_worker = Worker(
        "knowledge-crawl-queue",
        process_crawl_job,
        {
            "connection": redis_uri,
            "concurrency": 1,
        }
    )

    schema_worker = Worker(
        "schema-generation-queue",
        process_schema_generation,
        {
            "connection": redis_uri,
            "concurrency": 1,
        }
    )

    stop_event = asyncio.Event()

    def shutdown_handler():
        print("\n[Python Worker] Shutting down workers gracefully...")
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    print("[Python Worker] Listening on 'knowledge-crawl-queue' and 'schema-generation-queue'...")
    await stop_event.wait()

    await crawler_worker.close()
    await schema_worker.close()
    await close_all_connections()
    print("[Python Worker] All background workers and global connections closed.")

if __name__ == "__main__":
    asyncio.run(main())