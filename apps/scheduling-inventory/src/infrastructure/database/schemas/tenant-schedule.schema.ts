import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeIntervalDoc {
  start: string;
  end: string;
}

export interface IOperatingHoursDoc {
  monday: ITimeIntervalDoc[];
  tuesday: ITimeIntervalDoc[];
  wednesday: ITimeIntervalDoc[];
  thursday: ITimeIntervalDoc[];
  friday: ITimeIntervalDoc[];
  saturday: ITimeIntervalDoc[];
  sunday: ITimeIntervalDoc[];
}

export interface IBlackoutDateDoc {
  date: string;
  reason?: string;
  is_closed: boolean;
}

export interface ISchedulingEngineConfigDoc {
  booking_mode: 'time_slot' | 'date_range';
  default_lead_time_hours: number;
  max_advance_booking_days: number;
  cancellation_window_hours: number;
  hold_duration_minutes: number;
}

export interface IVerificationPolicyConfigDoc {
  require_otp_for_new_booking: boolean;
  require_otp_for_reschedule: boolean;
  require_otp_for_cancel: boolean;
}

export interface ITenantScheduleDoc extends Document<string> {
  _id: string;
  tenant_id: string;
  agent_id: string;
  timezone: string;
  currency: string;
  operating_hours: IOperatingHoursDoc;
  blackout_dates: IBlackoutDateDoc[];
  scheduling_engine: ISchedulingEngineConfigDoc;
  verification_policy: IVerificationPolicyConfigDoc;
  created_at: Date;
  updated_at: Date;
}

const TimeIntervalSchema = new Schema<ITimeIntervalDoc>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false },
);

const BlackoutDateSchema = new Schema<IBlackoutDateDoc>(
  {
    date: { type: String, required: true },
    reason: { type: String, default: '' },
    is_closed: { type: Boolean, default: true },
  },
  { _id: false },
);

export const TenantScheduleMongooseSchema = new Schema<ITenantScheduleDoc>(
  {
    _id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    agent_id: { type: String, required: true, index: true },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    operating_hours: {
      monday: { type: [TimeIntervalSchema], default: [] },
      tuesday: { type: [TimeIntervalSchema], default: [] },
      wednesday: { type: [TimeIntervalSchema], default: [] },
      thursday: { type: [TimeIntervalSchema], default: [] },
      friday: { type: [TimeIntervalSchema], default: [] },
      saturday: { type: [TimeIntervalSchema], default: [] },
      sunday: { type: [TimeIntervalSchema], default: [] },
    },
    blackout_dates: {
      type: [BlackoutDateSchema],
      default: [],
    },
    scheduling_engine: {
      booking_mode: {
        type: String,
        enum: ['time_slot', 'date_range'],
        default: 'time_slot',
      },
      default_lead_time_hours: { type: Number, default: 2 },
      max_advance_booking_days: { type: Number, default: 60 },
      cancellation_window_hours: { type: Number, default: 24 },
      hold_duration_minutes: { type: Number, default: 10 },
    },
    verification_policy: {
      require_otp_for_new_booking: { type: Boolean, default: false },
      require_otp_for_reschedule: { type: Boolean, default: true },
      require_otp_for_cancel: { type: Boolean, default: true },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tenant_schedules',
  },
);

TenantScheduleMongooseSchema.index({ tenant_id: 1, agent_id: 1 }, { unique: true });

export const TenantScheduleModel =
  mongoose.models.TenantSchedule ||
  mongoose.model<ITenantScheduleDoc>('TenantSchedule', TenantScheduleMongooseSchema);
