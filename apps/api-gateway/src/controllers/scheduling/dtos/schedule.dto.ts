import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TimeIntervalDtoSchema = z.object({
  start: z.string().min(1, 'Start time is required'),
  end: z.string().min(1, 'End time is required'),
});

export const OperatingHoursDtoSchema = z.object({
  monday: z.array(TimeIntervalDtoSchema).default([]),
  tuesday: z.array(TimeIntervalDtoSchema).default([]),
  wednesday: z.array(TimeIntervalDtoSchema).default([]),
  thursday: z.array(TimeIntervalDtoSchema).default([]),
  friday: z.array(TimeIntervalDtoSchema).default([]),
  saturday: z.array(TimeIntervalDtoSchema).default([]),
  sunday: z.array(TimeIntervalDtoSchema).default([]),
});

export const BlackoutDateDtoSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  reason: z.string().optional().default(''),
  is_closed: z.boolean().default(true),
});

export const SchedulingEngineConfigDtoSchema = z.object({
  booking_mode: z.enum(['time_slot', 'date_range']).default('time_slot'),
  default_lead_time_hours: z.number().int().min(0).default(2),
  max_advance_booking_days: z.number().int().min(1).default(60),
  cancellation_window_hours: z.number().int().min(0).default(24),
  hold_duration_minutes: z.number().int().min(1).default(10),
});

export const VerificationPolicyConfigDtoSchema = z.object({
  require_otp_for_new_booking: z.boolean().default(false),
});

export const GetTenantScheduleQueryDtoSchema = z.object({
  agent_id: z.string().optional().default(''),
});

export class GetTenantScheduleQueryDto extends createZodDto(GetTenantScheduleQueryDtoSchema) {}

export const UpdateTenantScheduleDtoSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  operating_hours: OperatingHoursDtoSchema.optional(),
  blackout_dates: z.array(BlackoutDateDtoSchema).optional(),
  scheduling_engine: SchedulingEngineConfigDtoSchema.optional(),
  verification_policy: VerificationPolicyConfigDtoSchema.optional(),
});

export class UpdateTenantScheduleDto extends createZodDto(UpdateTenantScheduleDtoSchema) {}

