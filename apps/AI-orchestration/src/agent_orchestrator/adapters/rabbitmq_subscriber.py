from __future__ import annotations

import asyncio
import json
import logging
import os

import aio_pika

from agent_orchestrator.domain.protocols import EventSubscriber, MessageHandler

logger = logging.getLogger(__name__)


class RabbitMQEventSubscriber(EventSubscriber):
    """
    RabbitMQ adapter implementing the EventSubscriber protocol.
    Encapsulates aio_pika connections, channels, prefetch QoS,
    and automatic message processing/acknowledgment.
    """

    def __init__(
        self,
        uri: str | None = None,
        prefetch_count: int = 5,
    ) -> None:
        self.uri = uri or os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672")
        self.prefetch_count = prefetch_count
        self._handlers: dict[str, MessageHandler] = {}
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None
        self._stop_event = asyncio.Event()

    async def subscribe(self, topic_or_queue: str, handler: MessageHandler) -> None:
        """Register a handler callback for a specific RabbitMQ queue."""
        self._handlers[topic_or_queue] = handler
        logger.info("[RabbitMQSubscriber] Registered handler for queue '%s'", topic_or_queue)

    async def start(self) -> None:
        """Initialize robust connection and channel."""
        logger.info("[RabbitMQSubscriber] Connecting to RabbitMQ at %s...", self.uri)
        self._connection = await aio_pika.connect_robust(self.uri)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=self.prefetch_count)
        self._stop_event.clear()
        logger.info(
            "[RabbitMQSubscriber] Channel established with prefetch=%d", self.prefetch_count
        )

    async def run(self) -> None:
        """Declare queues and attach consumption callbacks."""
        if self._channel is None:
            await self.start()

        if self._channel is None:
            raise RuntimeError("[RabbitMQSubscriber] Failed to initialize channel.")

        for queue_name, handler in self._handlers.items():
            queue = await self._channel.declare_queue(queue_name, durable=True)

            def _make_consumer_callback(q_name: str, h: MessageHandler):
                async def _on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
                    async with message.process():
                        try:
                            payload = json.loads(message.body.decode("utf-8"))
                            await h(payload)
                        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                            logger.error(
                                "[RabbitMQSubscriber] Failed to decode JSON from queue '%s': %s",
                                q_name,
                                exc,
                            )
                        except Exception as exc:
                            logger.error(
                                "[RabbitMQSubscriber] Error in handler for queue '%s': %s",
                                q_name,
                                exc,
                                exc_info=True,
                            )
                            raise

                return _on_message

            await queue.consume(_make_consumer_callback(queue_name, handler))
            logger.info("[RabbitMQSubscriber] Listening on queue '%s'...", queue_name)

        try:
            await self._stop_event.wait()
        except asyncio.CancelledError:
            logger.info("[RabbitMQSubscriber] Consumption task cancelled.")
        finally:
            await self.stop()

    async def stop(self) -> None:
        """Gracefully close channel and connection."""
        self._stop_event.set()
        if self._channel is not None and not self._channel.is_closed:
            try:
                await self._channel.close()
            except Exception:
                pass
            self._channel = None

        if self._connection is not None and not self._connection.is_closed:
            try:
                await self._connection.close()
                logger.info("[RabbitMQSubscriber] Connection closed.")
            except Exception:
                pass
            self._connection = None
