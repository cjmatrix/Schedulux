const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
const fromPhone = (process.env.TWILIO_FROM_PHONE || "").trim();
const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
const defaultCountryCode = (process.env.DEFAULT_COUNTRY_CODE || "+91").trim();

function normalizePhone(phone) {
  let cleaned = String(phone || "").replace(/[\s\-\(\)]/g, "").trim();
  if (!cleaned.startsWith("+")) {
    const prefix = defaultCountryCode.startsWith("+") ? defaultCountryCode : `+${defaultCountryCode}`;
    if (cleaned.length === 10) {
      cleaned = `${prefix}${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
}

async function sendRawSms(to, body) {
  const rawTo = String(to || "").trim();
  if (!rawTo) {
    throw new Error("Recipient phone number is required.");
  }
  const cleanedTo = normalizePhone(rawTo);

  if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
    const simulatedSid = `SM_sim_${Math.random().toString(36).substring(2, 15)}`;
    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("📱 [SmsService DEV MODE — SIMULATED SMS]");
    console.log(`   To:      ${cleanedTo}`);
    console.log(`   From:    ${fromPhone || messagingServiceSid || "+15550000000"}`);
    console.log(`   SID:     ${simulatedSid}`);
    console.log(`   Message: ${body}`);
    console.log("─────────────────────────────────────────────────────────────────\n");
    return { success: true, sid: simulatedSid, simulated: true };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const params = new URLSearchParams();
  params.append("To", cleanedTo);
  params.append("Body", body);

  if (messagingServiceSid) {
    params.append("MessagingServiceSid", messagingServiceSid);
  } else {
    params.append("From", fromPhone);
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMsg = `Twilio API error (${res.status}): ${res.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.message || errorMsg;
    } catch {
      errorMsg = errorText || errorMsg;
    }
    throw new Error(`[SmsService] Failed to send SMS to ${cleanedTo}: ${errorMsg}`);
  }

  const result = await res.json();
  const sid = result.sid || `SM_${Date.now()}`;
  console.log("\n─────────────────────────────────────────────────────────────────");
  console.log("📱 [SmsService TWILIO LIVE DISPATCH]");
  console.log(`   To:      ${cleanedTo}`);
  console.log(`   SID:     ${sid}`);
  console.log(`   Message: ${body}`);
  console.log("─────────────────────────────────────────────────────────────────\n");
  return { success: true, sid, simulated: false };
}

export const handler = async (event) => {
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const parsed = JSON.parse(record.body);
      const jobName = parsed.name || parsed.jobName || "";
      const payload = parsed.data || parsed;
      const to = payload.phone || payload.to;

      switch (jobName) {
        case "send-otp": {
          const body = `Your Schedulux verification code is: ${payload.code}. Valid for 5 minutes. Do not share this code.`;
          await sendRawSms(to, body);
          break;
        }

        case "send-booking-created":
        case "send-booking-confirmation": {
          const greeting = payload.customer_name || payload.customerName ? `Hi ${payload.customer_name || payload.customerName}` : "Hi";
          const service = payload.service_name || payload.serviceName || "Appointment";
          const ref = payload.booking_reference || payload.bookingReference || payload.booking_id;
          const refText = ref ? ` Ref: ${ref}.` : "";
          const body = `${greeting}, your booking for ${service} on ${payload.start_time || payload.startTime} is confirmed!${refText} Thank you for choosing us.`;
          await sendRawSms(to, body);
          break;
        }

        case "send-booking-cancelled": {
          const greeting = payload.customer_name || payload.customerName ? `Hi ${payload.customer_name || payload.customerName}` : "Hi";
          const service = payload.service_name || payload.serviceName || "Appointment";
          const ref = payload.booking_reference || payload.bookingReference || payload.booking_id;
          const refText = ref ? ` (Ref: ${ref})` : "";
          const body = `${greeting}, your appointment for ${service} scheduled for ${payload.start_time || payload.startTime} has been cancelled.${refText}`;
          await sendRawSms(to, body);
          break;
        }

        case "send-booking-rescheduled": {
          const greeting = payload.customer_name || payload.customerName ? `Hi ${payload.customer_name || payload.customerName}` : "Hi";
          const service = payload.service_name || payload.serviceName || "Appointment";
          const ref = payload.booking_reference || payload.bookingReference || payload.booking_id;
          const refText = ref ? ` (Ref: ${ref})` : "";
          const newTime = payload.new_start_time || payload.start_time || payload.startTime;
          const body = `${greeting}, your appointment for ${service} has been rescheduled to ${newTime}.${refText} See you then!`;
          await sendRawSms(to, body);
          break;
        }

        case "send-booking-completed": {
          const greeting = payload.customer_name || payload.customerName ? `Hi ${payload.customer_name || payload.customerName}` : "Hi";
          const service = payload.service_name || payload.serviceName || "Appointment";
          const ref = payload.booking_reference || payload.bookingReference || payload.booking_id;
          const refText = ref ? ` (Ref: ${ref})` : "";
          const body = `${greeting}, thank you for visiting us for your ${service} appointment!${refText} Your appointment is now marked as completed.`;
          await sendRawSms(to, body);
          break;
        }

        case "send-raw-sms": {
          await sendRawSms(to, payload.body);
          break;
        }

        default: {
          if (payload.body) {
            await sendRawSms(to, payload.body);
          } else {
            console.warn(`[SmsWorker] Ignored unknown job: ${jobName}`);
          }
          break;
        }
      }
    } catch (err) {
      console.error(`[SmsWorker] Error processing message ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
