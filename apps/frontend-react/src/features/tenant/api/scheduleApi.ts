import { type ApiResponse, axiosClient } from '../../../api/axiosClient';

export interface TimeInterval {
  start: string;
  end: string;
}

export interface OperatingHours {
  monday: TimeInterval[];
  tuesday: TimeInterval[];
  wednesday: TimeInterval[];
  thursday: TimeInterval[];
  friday: TimeInterval[];
  saturday: TimeInterval[];
  sunday: TimeInterval[];
}

export interface BlackoutDate {
  date: string;
  reason?: string;
  is_closed: boolean;
}

export interface SchedulingEngineConfig {
  booking_mode: 'time_slot' | 'date_range';
  default_lead_time_hours: number;
  max_advance_booking_days: number;
  cancellation_window_hours: number;
  hold_duration_minutes: number;
}

export interface VerificationPolicyConfig {
  require_otp_for_new_booking: boolean;
}

export interface TenantSchedule {
  id: string;
  tenant_id: string;
  agent_id: string;
  timezone: string;
  currency: string;
  operating_hours: OperatingHours;
  blackout_dates: BlackoutDate[];
  scheduling_engine: SchedulingEngineConfig;
  verification_policy: VerificationPolicyConfig;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateTenantSchedulePayload {
  agent_id: string;
  timezone?: string;
  currency?: string;
  operating_hours?: OperatingHours;
  blackout_dates?: BlackoutDate[];
  scheduling_engine?: SchedulingEngineConfig;
  verification_policy?: VerificationPolicyConfig;
}

export const scheduleApi = {
  getSchedule: async (agentId?: string): Promise<ApiResponse<TenantSchedule>> => {
    const { data } = await axiosClient.get<ApiResponse<TenantSchedule>>(
      '/api/v1/tenant/scheduling/schedule',
      {
        params: { agent_id: agentId || '' },
      },
    );
    return data;
  },

  updateSchedule: async (
    payload: UpdateTenantSchedulePayload,
  ): Promise<ApiResponse<TenantSchedule>> => {
    const { data } = await axiosClient.put<ApiResponse<TenantSchedule>>(
      '/api/v1/tenant/scheduling/schedule',
      payload,
    );
    return data;
  },
};

