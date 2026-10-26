"""
scheduling_consumer.py  —  CQRS Kafka Consumer for AI-Orchestration Service

Listens to:
  - scheduling.service.events   → service.created / service.updated / service.deleted
  - scheduling.resource.events  → resource.created / resource.updated / resource.deleted

On each event, upserts or removes the corresponding item from the
AgentRuntimeConfig.services[] / AgentRuntimeConfig.resources[] array,
keeping the AI runtime view in sync with the scheduling-inventory source of truth.

Industry-standard patterns used:
  - aiokafka for async Kafka consumer
  - Idempotent upsert with Beanie $set / $pull operators
  - Dead-letter queue via stderr logging (extend to a DLQ topic if needed)
  - Consumer group: ai-orchestration-consumer-group
  - Auto-commit disabled; manual commit after successful processing (at-least-once)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import ssl
from typing import Any

from aiokafka import AIOKafkaConsumer
from dotenv import load_dotenv

from agent_orchestrator.clients.redis_client import set_cached_draft
from agent_orchestrator.models import (
    AgentDraft,
    AgentRuntimeConfig,
    BookingMode,
    DepositEmbed,
    DispatchStatus,
    PriceEmbed,
    PriceType,
    ResourceEmbed,
    ResourceRequirementEmbed,
    ResourceType,
    ServiceEmbed,
    ServiceVerificationEmbed,
    init_db,
)

local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(local_env)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

KAFKA_BROKERS = os.environ.get("KAFKA_BROKERS", "localhost:9092")
KAFKA_USERNAME = os.environ.get("KAFKA_USERNAME", "")
KAFKA_PASSWORD = os.environ.get("KAFKA_PASSWORD", "")
CONSUMER_GROUP = os.environ.get("KAFKA_CONSUMER_GROUP", "ai-orchestration-consumer-group")
TOPICS = ["scheduling.service.events", "scheduling.resource.events"]


async def handle_service_event(payload: dict[str, Any]) -> None:
    event_type = payload.get("event_type", "")
    agent_id = payload.get("agent_id", "")
    service_id = payload.get("service_id", "")

    if not agent_id or not service_id:
        logger.warning(
            "[Consumer] Skipping service event — missing agent_id or service_id: %s", payload
        )
        return

    data = payload.get("data")
    price_raw = data.get("price", {}) if data else {}
    deposit_raw = data.get("deposit", {}) if data else {}

    config = await AgentRuntimeConfig.find_one({"agent_id": agent_id})
    if config:
        if event_type == "service.deleted":
            config.services = [s for s in config.services if s.service_id != service_id]
            await config.save()
            logger.info(
                "[Consumer] Removed service %s from live AgentRuntimeConfig of agent %s",
                service_id,
                agent_id,
            )
        elif data:
            price = PriceEmbed(
                type=PriceType(price_raw.get("type", "fixed")),
                amount=float(price_raw.get("amount", 0)),
                currency=price_raw.get("currency", "USD"),
            )
            deposit = DepositEmbed(
                required=bool(deposit_raw.get("required", False)),
                amount=float(deposit_raw.get("amount", 0)),
                processor=deposit_raw.get("processor", ""),
                upi_id=deposit_raw.get("upi_id", ""),
                qr_code_url=deposit_raw.get("qr_code_url", ""),
                confirmation_method=deposit_raw.get("confirmation_method", "automatic"),
                payment_instructions=deposit_raw.get("payment_instructions", ""),
            )
            existing_embed = next((s for s in config.services if s.service_id == service_id), None)
            verif_raw = data.get("verification")
            if verif_raw is not None and isinstance(verif_raw, dict):
                verification = ServiceVerificationEmbed(require_otp=verif_raw.get("require_otp"))
            elif existing_embed and existing_embed.verification:
                verification = existing_embed.verification
            else:
                verification = ServiceVerificationEmbed()

            new_embed = ServiceEmbed(
                service_id=service_id,
                name=data.get("name", ""),
                category=data.get("category", "General"),
                description=data.get("description", ""),
                duration_minutes=int(data.get("duration_minutes") or 30),
                buffer_minutes=int(data.get("buffer_minutes") or 0),
                booking_mode=BookingMode(data.get("booking_mode", "time_slot")),
                price=price,
                deposit=deposit,
                verification=verification,
                resource_requirements=[
                    ResourceRequirementEmbed(
                        role=req.get("role", "Staff"),
                        resource_type=req.get("resource_type", "staff"),
                        count=int(req.get("count") or 1),
                        eligible_resource_ids=req.get("eligible_resource_ids", []),
                    )
                    for req in (data.get("resource_requirements") or [])
                ],
                recall_interval_days=int(data.get("recall_interval_days") or 0),
            )
            config.services = [s for s in config.services if s.service_id != service_id]
            config.services.append(new_embed)
            await config.save()
            logger.info(
                "[Consumer] Upserted service %s into live AgentRuntimeConfig of agent %s",
                service_id,
                agent_id,
            )

    agent_draft = await AgentDraft.find_one({"agent_id": agent_id})
    if agent_draft:
        current_draft = dict(agent_draft.current_draft) if agent_draft.current_draft else {}
        raw_svcs = current_draft.get("services")
        svcs: list[dict[str, Any]] = (
            [s for s in raw_svcs if isinstance(s, dict)] if isinstance(raw_svcs, list) else []
        )
        if event_type == "service.deleted":
            current_draft["services"] = [s for s in svcs if s.get("service_id") != service_id]
        elif data:
            existing_draft_svc = next((s for s in svcs if s.get("service_id") == service_id), None)
            verif_dict = (
                data.get("verification")
                if "verification" in data
                else (existing_draft_svc.get("verification") if existing_draft_svc else None)
            )

            svc_dict: dict[str, Any] = {
                "service_id": service_id,
                "name": data.get("name", ""),
                "category": data.get("category", "General"),
                "description": data.get("description", ""),
                "duration_minutes": int(data.get("duration_minutes") or 30),
                "buffer_minutes": int(data.get("buffer_minutes") or 0),
                "booking_mode": data.get("booking_mode", "time_slot"),
                "price": price_raw,
                "deposit": deposit_raw,
                "verification": verif_dict,
                "resource_requirements": data.get("resource_requirements", []),
                "recall_interval_days": int(data.get("recall_interval_days") or 0),
            }
            updated_svcs = [s for s in svcs if s.get("service_id") != service_id]
            updated_svcs.append(svc_dict)
            current_draft["services"] = updated_svcs

        agent_draft.current_draft = current_draft
        await agent_draft.save()
        try:
            await set_cached_draft(agent_draft.tenant_id, agent_id, current_draft)
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced service %s to AgentDraft & Redis for agent %s", service_id, agent_id
        )


async def handle_resource_event(payload: dict[str, Any]) -> None:
    event_type = payload.get("event_type", "")
    agent_id = payload.get("agent_id", "")
    resource_id = payload.get("resource_id", "")

    if not agent_id or not resource_id:
        logger.warning(
            "[Consumer] Skipping resource event — missing agent_id or resource_id: %s", payload
        )
        return

    data = payload.get("data")

    config = await AgentRuntimeConfig.find_one({"agent_id": agent_id})
    if config:
        if event_type == "resource.deleted":
            config.resources = [r for r in config.resources if r.resource_id != resource_id]
            await config.save()
            logger.info(
                "[Consumer] Removed resource %s from live AgentRuntimeConfig of agent %s",
                resource_id,
                agent_id,
            )
        elif data:
            new_embed = ResourceEmbed(
                resource_id=resource_id,
                resource_type=ResourceType(data.get("resource_type", "staff")),
                name=data.get("name", ""),
                title=data.get("title", ""),
                category=data.get("category", "General"),
                description=data.get("description", ""),
                is_bookable=bool(data.get("is_bookable", True)),
                dispatch_status=DispatchStatus(data.get("dispatch_status", "active")),
                custom_shift_overrides=data.get("custom_shift_overrides", {}),
            )
            config.resources = [r for r in config.resources if r.resource_id != resource_id]
            config.resources.append(new_embed)
            await config.save()
            logger.info(
                "[Consumer] Upserted resource %s into live AgentRuntimeConfig of agent %s",
                resource_id,
                agent_id,
            )

    agent_draft = await AgentDraft.find_one({"agent_id": agent_id})
    if agent_draft:
        current_draft = dict(agent_draft.current_draft) if agent_draft.current_draft else {}
        raw_res = current_draft.get("resources")
        res_list: list[dict[str, Any]] = (
            [r for r in raw_res if isinstance(r, dict)] if isinstance(raw_res, list) else []
        )
        if event_type == "resource.deleted":
            current_draft["resources"] = [
                r for r in res_list if r.get("resource_id") != resource_id
            ]
        elif data:
            res_dict: dict[str, Any] = {
                "resource_id": resource_id,
                "resource_type": data.get("resource_type", "staff"),
                "name": data.get("name", ""),
                "title": data.get("title", ""),
                "category": data.get("category", "General"),
                "description": data.get("description", ""),
                "is_bookable": bool(data.get("is_bookable", True)),
                "dispatch_status": data.get("dispatch_status", "active"),
                "custom_shift_overrides": data.get("custom_shift_overrides", {}),
            }
            updated_res = [r for r in res_list if r.get("resource_id") != resource_id]
            updated_res.append(res_dict)
            current_draft["resources"] = updated_res

        agent_draft.current_draft = current_draft
        await agent_draft.save()
        try:
            await set_cached_draft(agent_draft.tenant_id, agent_id, current_draft)
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced resource %s to AgentDraft & Redis for agent %s",
            resource_id,
            agent_id,
        )


async def dispatch(topic: str, raw_value: bytes) -> None:
    try:
        payload = json.loads(raw_value.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.error("[Consumer] Failed to decode message on topic %s: %s", topic, exc)
        return

    event_type = payload.get("event_type", "")
    service_id = payload.get("service_id", "")
    resource_id = payload.get("resource_id", "")
    aggregate_id = service_id or resource_id or ""
    timestamp = payload.get("timestamp", "")
    event_id = payload.get("event_id") or f"kafka_{aggregate_id}_{timestamp}"

    logger.info("[Consumer] Processing event=%s id=%s on topic=%s", event_type, event_id, topic)

    try:
        if topic == "scheduling.service.events":
            await handle_service_event(payload)
        elif topic == "scheduling.resource.events":
            await handle_resource_event(payload)
        else:
            logger.warning("[Consumer] Unknown topic: %s", topic)
    except Exception as exc:
        logger.error(
            "[Consumer] Error processing event %s (id=%s): %s",
            event_type,
            event_id,
            exc,
            exc_info=True,
        )
        raise


async def run_consumer() -> None:
    await init_db()

    logger.info("[Consumer] Connecting to Kafka brokers: %s", KAFKA_BROKERS)
    logger.info("[Consumer] Subscribing to topics: %s", TOPICS)

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    consumer = AIOKafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BROKERS,
        group_id=CONSUMER_GROUP,
        security_protocol="SASL_SSL",
        sasl_mechanism="SCRAM-SHA-256",
        sasl_plain_username=KAFKA_USERNAME,
        sasl_plain_password=KAFKA_PASSWORD,
        ssl_context=ssl_context,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
        value_deserializer=None,
        max_poll_interval_ms=300_000,
    )

    await consumer.start()
    logger.info("[Consumer] Kafka consumer started — listening for scheduling events...")

    try:
        async for msg in consumer:
            await dispatch(msg.topic, msg.value)

            await consumer.commit()
    except asyncio.CancelledError:
        logger.info("[Consumer] Consumer task cancelled — shutting down.")
    except Exception as exc:
        logger.error("[Consumer] Fatal consumer error: %s", exc, exc_info=True)
        raise
    finally:
        await consumer.stop()
        logger.info("[Consumer] Kafka consumer stopped.")


def main() -> None:
    """Entry point for running the consumer standalone."""
    asyncio.run(run_consumer())


if __name__ == "__main__":
    main()
