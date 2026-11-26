from __future__ import annotations

import asyncio
import logging

from agent_orchestrator.adapters.sqs_client import poll_sqs_queue, resolve_queue_url
from agent_orchestrator.domain.protocols import EventSubscriber, MessageHandler

logger = logging.getLogger(__name__)


class SqsEventSubscriber(EventSubscriber):
    

    def __init__(
        self,
        url_env_map: dict[str, str] | None = None,
        max_messages: int = 5,
        wait_seconds: int = 20,
    ) -> None:
        self.url_env_map = url_env_map or {}
        self.max_messages = max_messages
        self.wait_seconds = wait_seconds
        self._handlers: dict[str, MessageHandler] = {}
        self._queue_urls: dict[str, str] = {}
        self._stop_event = asyncio.Event()

    async def subscribe(self, topic_or_queue: str, handler: MessageHandler) -> None:
        self._handlers[topic_or_queue] = handler
        logger.info("[SqsSubscriber] Registered handler for queue '%s'", topic_or_queue)

    async def start(self) -> None:
        self._stop_event.clear()
        for queue_ref in self._handlers:
            if queue_ref.startswith("https://") or queue_ref.startswith("http://"):
                self._queue_urls[queue_ref] = queue_ref
                continue
            url_env = self.url_env_map.get(queue_ref, "AWS_SQS_QUEUE_URL")
            try:
                self._queue_urls[queue_ref] = await resolve_queue_url(
                    url_env, default_name=queue_ref
                )
            except Exception as exc:
                logger.error(
                    "[SqsSubscriber] Could not resolve SQS queue '%s' (env=%s): %s",
                    queue_ref,
                    url_env,
                    exc,
                )
        logger.info("[SqsSubscriber] Resolved %d SQS queue(s).", len(self._queue_urls))

    async def run(self) -> None:
        if not self._queue_urls and self._handlers:
            await self.start()

        poll_tasks = []
        for queue_ref, handler in self._handlers.items():
            queue_url = self._queue_urls.get(queue_ref)
            if not queue_url:
                continue

            async def _on_msg(payload, _attrs, _raw, h=handler):
                await h(payload)

            poll_tasks.append(
                asyncio.create_task(
                    poll_sqs_queue(
                        queue_url,
                        _on_msg,
                        self._stop_event,
                        max_messages=self.max_messages,
                        wait_seconds=self.wait_seconds,
                        label="SqsSubscriber",
                    )
                )
            )
            logger.info("[SqsSubscriber] Listening on SQS '%s'...", queue_url)

        try:
            await self._stop_event.wait()
        except asyncio.CancelledError:
            logger.info("[SqsSubscriber] Consumption task cancelled.")
        finally:
            await self.stop()
            if poll_tasks:
                await asyncio.gather(*poll_tasks, return_exceptions=True)

    async def stop(self) -> None:
        self._stop_event.set()
