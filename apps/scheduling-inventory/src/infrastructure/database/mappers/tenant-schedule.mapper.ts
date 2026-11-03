import type {
  BlackoutDateInfo,
  OperatingHoursInfo,
  SchedulingEngineConfigInfo,
  TenantScheduleInfo,
  VerificationPolicyConfigInfo,
} from '@repo/proto/scheduling';
import type { ITenantScheduleDoc } from '../schemas/tenant-schedule.schema.js';

export class TenantScheduleMapper {
  static toProto(doc: ITenantScheduleDoc): TenantScheduleInfo {
    const operatingHours: OperatingHoursInfo = {
      monday: doc.operating_hours?.monday || [],
      tuesday: doc.operating_hours?.tuesday || [],
      wednesday: doc.operating_hours?.wednesday || [],
      thursday: doc.operating_hours?.thursday || [],
      friday: doc.operating_hours?.friday || [],
      saturday: doc.operating_hours?.saturday || [],
      sunday: doc.operating_hours?.sunday || [],
    };

    const blackoutDates: BlackoutDateInfo[] = (doc.blackout_dates || []).map((b) => ({
      date: b.date,
      reason: b.reason || '',
      is_closed: b.is_closed ?? true,
    }));

    const schedulingEngine: SchedulingEngineConfigInfo = {
      booking_mode: doc.scheduling_engine?.booking_mode || 'time_slot',
      default_lead_time_hours: doc.scheduling_engine?.default_lead_time_hours ?? 2,
      max_advance_booking_days: doc.scheduling_engine?.max_advance_booking_days ?? 60,
      cancellation_window_hours: doc.scheduling_engine?.cancellation_window_hours ?? 24,
      hold_duration_minutes: doc.scheduling_engine?.hold_duration_minutes ?? 10,
    };

    const verificationPolicy: VerificationPolicyConfigInfo = {
      require_otp_for_new_booking: doc.verification_policy?.require_otp_for_new_booking ?? false,
    };

    return {
      id: doc._id,
      tenant_id: doc.tenant_id,
      agent_id: doc.agent_id,
      timezone: doc.timezone || 'UTC',
      currency: doc.currency || 'USD',
      operating_hours: operatingHours,
      blackout_dates: blackoutDates,
      scheduling_engine: schedulingEngine,
      verification_policy: verificationPolicy,
      created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
      updated_at: doc.updated_at ? new Date(doc.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}

