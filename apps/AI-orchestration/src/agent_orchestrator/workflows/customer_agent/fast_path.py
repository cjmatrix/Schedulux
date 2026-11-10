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
    """Evaluate tool execution results and return an instant deterministic response

    Returns a formatted string if the action succeeded on the happy path, bypassing
    the second LLM round-trip. Returns None if the tool output requires conversational
    LLM reasoning or explanation (e.g. error, slot selection, or clarification).
    """
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

            price = data.get("price")
            price_line = ""
            if isinstance(price, dict) and price.get("amount") is not None:
                currency = price.get("currency", "$")
                price_line = f"\n• **Price**: {currency}{price.get('amount')}"
            elif isinstance(price, (int, float)) and price > 0:
                price_line = f"\n• **Price**: ${price}"

            return (
                f"🎉 **Your appointment is confirmed!**\n\n"
                f"• **Booking Reference**: `{ref}`\n"
                f"• **Date & Time**: {time_local}{tz_str}"
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

            lines = ["📅 **Your Upcoming Appointments:**\n"]
            for idx, bk in enumerate(bookings, 1):
                b_ref = bk.get("booking_reference") or bk.get("booking_id") or "N/A"
                b_time = bk.get("start_time_local") or bk.get("start_time_utc", "")
                b_status = bk.get("status", "confirmed").capitalize()
                lines.append(f"{idx}. **Reference**: `{b_ref}` — {b_time} ({b_status})")

            lines.append("\nNeed to reschedule or cancel any of these? Simply let me know!")
            return "\n".join(lines)
        return None

    return None
