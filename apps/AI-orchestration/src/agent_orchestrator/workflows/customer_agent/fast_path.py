from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


def format_deterministic_fast_path(
    tool_name: str,
    raw_output: str,
    biz_context: dict[str, Any] | None = None,
) -> str | None:

    if not raw_output or not isinstance(raw_output, str):
        return None

    try:
        data = json.loads(raw_output)
    except Exception:
        return None

    if not isinstance(data, dict):
        return None

    status = str(data.get("status", "")).lower()

    if tool_name == "send_booking_otp":
        if status == "sent":
            phone = data.get("phone", "")
            phone_str = f" to **{phone}**" if phone else ""
            return (
                f"📱 We've sent a 6-digit verification code{phone_str} via SMS. "
                "Please reply with the 6-digit code to complete your verification."
            )
        return None

    if tool_name == "verify_booking_otp":
        if status == "verified":
            phone = data.get("phone", "")
            phone_str = f" ({phone})" if phone else ""
            return (
                f"✅ **Phone Verified!**\n\nYour phone number{phone_str} is now authenticated for this session. "
                "How would you like to proceed with your booking?"
            )
        return None

    if tool_name == "book_appointment":
        if status == "confirmed":
            ref = data.get("booking_reference") or data.get("booking_id") or "Confirmed"
            time_local = data.get("start_time_local") or data.get("start_time_utc", "")
            tz = data.get("timezone", "")
            tz_str = f" ({tz})" if tz and tz.upper() != "UTC" else ""

            svc_name = data.get("service_name")
            if not svc_name and biz_context and data.get("service_id"):
                svc_map = {
                    (s.get("id") or s.get("service_id")): s.get("name")
                    for s in biz_context.get("services", [])
                }
                svc_name = svc_map.get(data.get("service_id"))
            svc_line = f"\n• **Service**: {svc_name}" if svc_name else ""

            res_name = data.get("resource_name")
            if not res_name and biz_context and data.get("resource_id"):
                res_map = {
                    (r.get("id") or r.get("resource_id")): r.get("name")
                    for r in biz_context.get("resources", [])
                }
                res_name = res_map.get(data.get("resource_id"))
            res_line = f"\n• **Specialist/Unit**: {res_name}" if res_name and res_name != "Auto-Assigned Unit" else ""

            price = data.get("price")
            price_line = ""
            if isinstance(price, dict) and price.get("amount") is not None:
                currency = price.get("currency", "$")
                price_line = f"\n• **Price**: {currency}{price.get('amount')}"
            elif isinstance(price, (int, float)) and price > 0:
                price_line = f"\n• **Price**: ${price}"

            return (
                f"🎉 **Your appointment is confirmed!**\n\n"
                f"• **Booking Reference**: `{ref}`"
                f"{svc_line}\n"
                f"• **Date & Time**: {time_local}{tz_str}"
                f"{res_line}"
                f"{price_line}\n\n"
                "A confirmation has been recorded. If you need to make changes or have any questions, "
                "feel free to reach out anytime!"
            )
        return None

    if tool_name == "reschedule_appointment":
        if status == "rescheduled":
            ref = data.get("booking_reference") or "Confirmed"
            new_time = data.get("new_start_time_local") or data.get("new_start_time_utc", "")
            tz = data.get("timezone", "")
            tz_str = f" ({tz})" if tz and tz.upper() != "UTC" else ""

            return (
                f"🔄 **Appointment Rescheduled!**\n\n"
                f"Your appointment (`{ref}`) has been successfully moved to **{new_time}{tz_str}**.\n\n"
                "Your booking record has been updated. Feel free to let me know if you need anything else!"
            )
        return None

    if tool_name == "cancel_appointment":
        if status == "cancelled":
            ref = data.get("booking_reference") or ""
            ref_str = f" (`{ref}`)" if ref else ""
            return (
                f"❌ **Appointment Canceled**\n\n"
                f"Your appointment{ref_str} has been successfully canceled. "
                "Please let us know if you would like to schedule another visit in the future!"
            )
        return None

    if tool_name == "get_customer_bookings":
        if status == "success":
            bookings = data.get("bookings") or []
            if not bookings:
                return "📅 You currently have no upcoming appointments on file."

            svc_map = {}
            res_map = {}
            if biz_context:
                svc_map = {
                    (s.get("id") or s.get("service_id")): s.get("name")
                    for s in biz_context.get("services", [])
                    if (s.get("id") or s.get("service_id"))
                }
                res_map = {
                    (r.get("id") or r.get("resource_id")): r.get("name")
                    for r in biz_context.get("resources", [])
                    if (r.get("id") or r.get("resource_id"))
                }

            header = (
                "📅 **Your Upcoming Appointment:**\n\n"
                if len(bookings) == 1
                else "📅 **Your Upcoming Appointments:**\n\n"
            )
            cards = []
            for idx, bk in enumerate(bookings, 1):
                b_ref = bk.get("booking_reference") or bk.get("booking_id") or "N/A"
                b_status = bk.get("status", "confirmed").capitalize()

                # Service name
                b_svc = (
                    bk.get("service_name")
                    or svc_map.get(bk.get("service_id"))
                    or "Scheduled Service"
                )

              
                b_mode = bk.get("booking_mode", "time_slot")
                s_local = bk.get("start_time_local") or bk.get("start_time_utc", "")
                e_local = bk.get("end_time_local") or bk.get("end_time_utc", "")
                duration = bk.get("duration_minutes")
                stay_duration = bk.get("stay_duration")

                if b_mode == "date_range":
                    if s_local and e_local:
                        stay_str = f" ({stay_duration})" if stay_duration else ""
                        schedule_str = f"Check-in: **{s_local}** — Check-out: **{e_local}**{stay_str}"
                    else:
                        schedule_str = f"**{s_local or e_local or 'N/A'}**"
                else:
                    dur_str = f" ({duration} mins)" if duration else ""
                    schedule_str = f"**{s_local}**{dur_str}" if s_local else "N/A"

               
                b_res = bk.get("resource_name") or res_map.get(bk.get("resource_id"))
                assigned = bk.get("assigned_resources") or []
                if assigned:
                    valid_assigned = [r for r in assigned if r and r != "Auto-Assigned Unit"]
                    if valid_assigned:
                        b_res = ", ".join(valid_assigned)

              
                price = bk.get("price")
                price_str = ""
                if isinstance(price, dict) and price.get("amount") is not None:
                    curr = price.get("currency", "$")
                    price_str = f"{curr} {price.get('amount')}"
                elif isinstance(price, (int, float)) and price > 0:
                    price_str = f"${price}"

                
                c_name = bk.get("customer_name")
                c_phone = bk.get("customer_phone")

                # Notes
                notes = bk.get("notes")

                card_lines = [
                    f"{idx}. 🏷️ **{b_svc}**",
                    f"   • **Reference**: `{b_ref}` ({b_status})",
                    f"   • **Schedule**: {schedule_str}",
                ]
                if b_res and b_res != "Auto-Assigned Unit":
                    card_lines.append(f"   • **Specialist/Unit**: {b_res}")
                if price_str:
                    card_lines.append(f"   • **Price**: {price_str}")
                if c_name:
                    phone_part = f" ({c_phone})" if c_phone else ""
                    card_lines.append(f"   • **Customer**: {c_name}{phone_part}")
                if notes:
                    card_lines.append(f"   • **Notes**: {notes}")

                cards.append("\n".join(card_lines))

            footer = "\n\nNeed to reschedule or cancel any of these? Simply let me know!"
            return header + "\n\n".join(cards) + footer
        return None

    return None
