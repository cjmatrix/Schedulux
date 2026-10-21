import json
import logging
import os
from typing import Any

import grpc

from agent_orchestrator.models import (
    DepositEmbed,
    PriceEmbed,
    ResourceEmbed,
    ServiceEmbed,
    ServiceVerificationEmbed,
)
from agent_orchestrator.proto import scheduling_pb2, scheduling_pb2_grpc

logger = logging.getLogger(__name__)

SCHEDULING_SERVICE_URL = os.environ.get("SCHEDULING_SERVICE_URL", "localhost:50053")
GRPC_TIMEOUT_SECONDS = float(os.environ.get("SCHEDULING_GRPC_TIMEOUT", 15.0))


def build_embedded_resources(raw_resources: list[dict[str, Any]]) -> list[ResourceEmbed]:
    resources_list: list[ResourceEmbed] = []
    for res in raw_resources:
        resources_list.append(
            ResourceEmbed(
                resource_id=res.get("resource_id", ""),
                resource_type=res.get("resource_type", "staff"),
                name=res.get("name", "unnamed"),
                title=res.get("title") or "",
                category=res.get("category") or "General",
                description=res.get("description") or "",
                is_bookable=res.get("is_bookable", True),
                dispatch_status=res.get("dispatch_status", "active"),
                custom_shift_overrides=res.get("custom_shift_overrides", {}),
            )
        )
    return resources_list


def build_embedded_services(raw_services: list[dict[str, Any]]) -> list[ServiceEmbed]:
    services_list: list[ServiceEmbed] = []
    for svc in raw_services:
        price_d = svc.get("price", {}) or {}
        deposit_d = svc.get("deposit", {}) or {}
        verif_d = svc.get("verification", {}) or {}
        services_list.append(
            ServiceEmbed(
                service_id=svc.get("service_id", ""),
                name=svc.get("name", "unnamed"),
                category=svc.get("category") or "General",
                description=svc.get("description") or "",
                duration_minutes=int(svc.get("duration_minutes") or 30),
                buffer_minutes=int(svc.get("buffer_minutes") or 0),
                allocation_model=svc.get("allocation_model", "single_resource"),
                booking_mode=svc.get("booking_mode", "time_slot"),
                price=PriceEmbed(
                    type=price_d.get("type", "fixed"),
                    amount=float(price_d.get("amount", 0.0)),
                    currency=price_d.get("currency", "USD"),
                )
                if price_d
                else PriceEmbed(),
                deposit=DepositEmbed(
                    required=bool(deposit_d.get("required", False)),
                    amount=float(deposit_d.get("amount", 0.0)),
                    processor=deposit_d.get("processor") or "",
                    upi_id=deposit_d.get("upi_id") or "",
                    qr_code_url=deposit_d.get("qr_code_url") or "",
                    confirmation_method=deposit_d.get("confirmation_method") or "automatic",
                    payment_instructions=deposit_d.get("payment_instructions") or "",
                )
                if deposit_d
                else DepositEmbed(),
                verification=ServiceVerificationEmbed(require_otp=verif_d.get("require_otp"))
                if verif_d
                else ServiceVerificationEmbed(),
                eligible_resource_ids=svc.get("eligible_resource_ids", []),
                required_asset_ids=svc.get("required_asset_ids", []),
                recall_interval_days=int(svc.get("recall_interval_days") or 0),
            )
        )
    return services_list


async def sync_agent_inventory(
    tenant_id: str,
    agent_id: str,
    draft: dict[str, Any],
) -> dict[str, Any]:

    if not tenant_id:
        return {
            "success": False,
            "error": "Missing tenant_id",
            "resources": [],
            "services": [],
            "draft": draft,
        }

    target_url = SCHEDULING_SERVICE_URL
    raw_resources = draft.get("resources", [])
    raw_services = draft.get("services", [])

    logger.info(
        "[SchedulingClient] Initiating atomic BatchSyncInventory to %s (tenant: %s, agent: %s, %d resources, %d services)",
        target_url,
        tenant_id,
        agent_id,
        len(raw_resources),
        len(raw_services),
    )

    try:
        proto_resources: list[scheduling_pb2.CreateResourceRequest] = []
        for res in raw_resources:
            custom_shifts = res.get("custom_shift_overrides") or {}
            shifts_json = (
                json.dumps(custom_shifts)
                if isinstance(custom_shifts, (dict, list))
                else str(custom_shifts)
            )
            proto_resources.append(
                scheduling_pb2.CreateResourceRequest(
                    tenant_id=tenant_id,
                    agent_id=agent_id or None,
                    resource_id=res.get("resource_id") or None,
                    resource_type=res.get("resource_type") or "staff",
                    name=(res.get("name") or "Unnamed").strip(),
                    title=res.get("title") or "",
                    category=res.get("category") or "General",
                    description=res.get("description") or "",
                    is_bookable=res.get("is_bookable", True),
                    dispatch_status=res.get("dispatch_status") or "active",
                    custom_shift_overrides_json=shifts_json,
                )
            )

        proto_services: list[scheduling_pb2.CreateServiceRequest] = []
        for svc in raw_services:
            price_d = svc.get("price") or {}
            deposit_d = svc.get("deposit") or {}
            verif_d = svc.get("verification") or {}
            verif_info = None
            if verif_d and verif_d.get("require_otp") is not None:
                verif_info = scheduling_pb2.ServiceVerificationInfo(
                    require_otp=bool(verif_d["require_otp"])
                )

            proto_services.append(
                scheduling_pb2.CreateServiceRequest(
                    tenant_id=tenant_id,
                    agent_id=agent_id or None,
                    service_id=svc.get("service_id") or None,
                    name=(svc.get("name") or "Unnamed").strip(),
                    category=svc.get("category") or "General",
                    description=svc.get("description") or "",
                    duration_minutes=int(svc.get("duration_minutes") or 30),
                    buffer_minutes=int(svc.get("buffer_minutes") or 0),
                    allocation_model=str(svc.get("allocation_model") or "single_resource"),
                    booking_mode=str(svc.get("booking_mode") or "time_slot"),
                    price=scheduling_pb2.PriceInfo(
                        type=str(price_d.get("type") or "fixed"),
                        amount=float(price_d.get("amount") or 0.0),
                        currency=str(price_d.get("currency") or "USD"),
                    ),
                    deposit=scheduling_pb2.DepositInfo(
                        required=bool(deposit_d.get("required", False)),
                        amount=float(deposit_d.get("amount") or 0.0),
                        processor=str(deposit_d.get("processor") or ""),
                        upi_id=str(deposit_d.get("upi_id") or ""),
                        qr_code_url=str(deposit_d.get("qr_code_url") or ""),
                        confirmation_method=str(
                            deposit_d.get("confirmation_method") or "automatic"
                        ),
                        payment_instructions=str(deposit_d.get("payment_instructions") or ""),
                    ),
                    verification=verif_info,
                    eligible_resource_ids=svc.get("eligible_resource_ids") or [],
                    required_asset_ids=svc.get("required_asset_ids") or [],
                    recall_interval_days=int(svc.get("recall_interval_days") or 0),
                )
            )

        batch_request = scheduling_pb2.BatchSyncInventoryRequest(
            tenant_id=tenant_id,
            agent_id=agent_id or "",
            resources=proto_resources,
            services=proto_services,
        )

        async with grpc.aio.insecure_channel(target_url) as channel:
            stub = scheduling_pb2_grpc.SchedulingInventoryServiceStub(channel)
            resp: scheduling_pb2.BatchSyncInventoryResponse = await stub.BatchSyncInventory(
                batch_request,
                timeout=GRPC_TIMEOUT_SECONDS,
            )

        if not resp.success:
            logger.error("[SchedulingClient] BatchSyncInventory returned failure: %s", resp.message)
            return {
                "success": False,
                "error": resp.message,
                "resources_synced": 0,
                "services_synced": 0,
                "resources": build_embedded_resources(raw_resources),
                "services": build_embedded_services(raw_services),
                "draft": draft,
            }

        for res, proto_res in zip(raw_resources, resp.resources, strict=False):
            res["resource_id"] = proto_res.resource_id

        for svc, proto_svc in zip(raw_services, resp.services, strict=False):
            svc["service_id"] = proto_svc.service_id
            svc["eligible_resource_ids"] = list(proto_svc.eligible_resource_ids)

        resources_list = build_embedded_resources(raw_resources)
        services_list = build_embedded_services(raw_services)

        logger.info(
            "[SchedulingClient] BatchSyncInventory succeeded atomically (%d resources, %d services synced)",
            len(resp.resources),
            len(resp.services),
        )

        return {
            "success": True,
            "error": None,
            "resources_synced": len(resp.resources),
            "services_synced": len(resp.services),
            "resources": resources_list,
            "services": services_list,
            "draft": draft,
        }

    except grpc.RpcError as rpc_err:
        err_msg = f"gRPC error ({rpc_err.code()}): {rpc_err.details()}"
        logger.error(
            "[SchedulingClient Error] Failed BatchSyncInventory to %s: %s", target_url, err_msg
        )
        return {
            "success": False,
            "error": err_msg,
            "resources_synced": 0,
            "services_synced": 0,
            "resources": build_embedded_resources(raw_resources),
            "services": build_embedded_services(raw_services),
            "draft": draft,
        }
    except Exception as e:
        err_msg = str(e)
        logger.error(
            "[SchedulingClient Error] Unexpected error during BatchSyncInventory: %s", err_msg
        )
        return {
            "success": False,
            "error": err_msg,
            "resources_synced": 0,
            "services_synced": 0,
            "resources": build_embedded_resources(raw_resources),
            "services": build_embedded_services(raw_services),
            "draft": draft,
        }
