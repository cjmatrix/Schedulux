export interface OtpSmsData {
  to: string;
  code: string;
  tenant_id?: string;
  agent_id?: string;
}

export interface BookingCreatedSmsData {
  to: string;
  customer_name?: string;
  service_name?: string;
  start_time: string;
  booking_reference?: string;
}

export interface BookingCancelledSmsData {
  to: string;
  customer_name?: string;
  service_name?: string;
  start_time: string;
  booking_reference?: string;
}

export interface RawSmsData {
  to: string;
  body: string;
}

export interface SmsSendResult {
  success: boolean;
  sid: string;
  simulated: boolean;
  error?: string;
}

export class SmsService {
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;
  private messagingServiceSid: string;

  constructor() {
    this.accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    this.authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    this.fromPhone = (process.env.TWILIO_FROM_PHONE || '').trim();
    this.messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim();

    if (this.accountSid && this.authToken && (this.fromPhone || this.messagingServiceSid)) {
      console.log(
        ` [SmsService] Configured with Twilio Account SID: ${this.accountSid.slice(0, 6)}... (Sender: ${
          this.messagingServiceSid ? 'MessagingService ' + this.messagingServiceSid : this.fromPhone
        })`,
      );
    } else {
      console.log(
        'ℹ [SmsService] No full Twilio credentials provided. Running in DEV mode (SMS logged to terminal).',
      );
    }
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();
    if (!cleaned.startsWith('+')) {
      const defaultCountry = (process.env.DEFAULT_COUNTRY_CODE || '+91').trim();
      const prefix = defaultCountry.startsWith('+') ? defaultCountry : `+${defaultCountry}`;
      if (cleaned.length === 10) {
        cleaned = `${prefix}${cleaned}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }
    return cleaned;
  }

  async sendRawSms(to: string, body: string): Promise<SmsSendResult> {
    const rawTo = to.trim();
    if (!rawTo) {
      throw new Error('Recipient phone number is required.');
    }
    const cleanedTo = this.normalizePhone(rawTo);

    if (
      !this.accountSid ||
      !this.authToken ||
      (!this.fromPhone && !this.messagingServiceSid)
    ) {
      const simulatedSid = `SM_sim_${Math.random().toString(36).substring(2, 15)}`;
      console.log('\n─────────────────────────────────────────────────────────────────');
      console.log('📱 [SmsService DEV MODE — SIMULATED SMS]');
      console.log(`   To:      ${cleanedTo}`);
      console.log(`   From:    ${this.fromPhone || this.messagingServiceSid || '+15550000000'}`);
      console.log(`   SID:     ${simulatedSid}`);
      console.log(`   Message: ${body}`);
      console.log('─────────────────────────────────────────────────────────────────\n');
      return { success: true, sid: simulatedSid, simulated: true };
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      this.accountSid,
    )}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', cleanedTo);
    params.append('Body', body);

    if (this.messagingServiceSid) {
      params.append('MessagingServiceSid', this.messagingServiceSid);
    } else {
      params.append('From', this.fromPhone);
    }

    const authHeader = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
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

    const result = (await res.json()) as { sid?: string };
    const sid = result.sid || `SM_${Date.now()}`;
    console.log(` [SmsService] SMS dispatched successfully to ${cleanedTo} (SID: ${sid})`);
    return { success: true, sid, simulated: false };
  }

  async sendOtpSms(data: OtpSmsData): Promise<SmsSendResult> {
    const body = `Your Schedulux verification code is: ${data.code}. Valid for 5 minutes. Do not share this code.`;
    return this.sendRawSms(data.to, body);
  }

  async sendBookingCreatedSms(data: BookingCreatedSmsData): Promise<SmsSendResult> {
    const greeting = data.customer_name ? `Hi ${data.customer_name}` : 'Hi';
    const service = data.service_name || 'Appointment';
    const refText = data.booking_reference ? ` Ref: ${data.booking_reference}.` : '';
    const body = `${greeting}, your booking for ${service} on ${data.start_time} is confirmed!${refText} Thank you for choosing us.`;
    return this.sendRawSms(data.to, body);
  }

  async sendBookingCancelledSms(data: BookingCancelledSmsData): Promise<SmsSendResult> {
    const greeting = data.customer_name ? `Hi ${data.customer_name}` : 'Hi';
    const service = data.service_name || 'Appointment';
    const refText = data.booking_reference ? ` (Ref: ${data.booking_reference})` : '';
    const body = `${greeting}, your appointment for ${service} scheduled for ${data.start_time} has been cancelled.${refText}`;
    return this.sendRawSms(data.to, body);
  }
}

export const smsService = new SmsService();
