import os
from bullmq import Queue
import redis.asyncio as aioredis
from dotenv import load_dotenv


dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', '.env')
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(dotenv_path)

redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")


_schema_queue: Queue | None = None
_crawl_queue: Queue | None = None
_redis_client: aioredis.Redis | None = None

def get_schema_queue() -> Queue:
    """Returns global singleton BullMQ schema-generation-queue instance."""
    global _schema_queue
    if _schema_queue is None:
        _schema_queue = Queue("schema-generation-queue", {"connection": redis_uri})
    return _schema_queue

def get_crawl_queue() -> Queue:
    """Returns global singleton BullMQ knowledge-crawl-queue instance."""
    global _crawl_queue
    if _crawl_queue is None:
        _crawl_queue = Queue("knowledge-crawl-queue", {"connection": redis_uri})
    return _crawl_queue

def get_redis_client() -> aioredis.Redis:
    """Returns global singleton Redis client with connection pooling."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(redis_uri, decode_responses=True)
    return _redis_client

async def close_all_connections():
    """Gracefully closes all global queues and Redis client connection pools."""
    global _schema_queue, _crawl_queue, _redis_client
    if _schema_queue is not None:
        await _schema_queue.close()
        _schema_queue = None
    if _crawl_queue is not None:
        await _crawl_queue.close()
        _crawl_queue = None
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
