import type { ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import type { GuardrailsData } from './components/SecurityGuardrailsCard.js';

export type { GuardrailsData };

export interface Message {
  id: string;
  role: 'agent' | 'tenant';
  text: string;
}

export type RightViewMode = 'rules' | 'sandbox' | 'json';

export type CanvasModule =
  | 'all'
  | 'profile'
  | 'services'
  | 'resources'
  | 'scheduling'
  | 'guardrails';

export interface ContactData {
  support_email?: string | null;
  public_phone?: string | null;
  escalation_phone?: string | null;
}

export interface TerminologyData {
  customer_singular?: string | null;
  customer_plural?: string | null;
  primary_metric?: string | null;
  action_metric?: string | null;
}

export interface BusinessProfileData {
  name?: string;
  clinic_name?: string;
  timezone?: string;
  currency?: string;
  industry?: string;
  vertical?: string;
  locale?: string;
  address?: string | null;
  description?: string;
  contact?: ContactData;
  terminology?: TerminologyData;
  [key: string]: unknown;
}

export interface TimeSlot {
  start?: string;
  end?: string;
}

export interface BlackoutDate {
  date?: string;
  reason?: string;
  is_closed?: boolean;
}

export type OperatingHoursData = Record<string, TimeSlot[]> & {
  blackout_dates?: BlackoutDate[];
};

export interface SchedulingEngineData {
  booking_mode?: 'time_slot' | 'date_range' | string;
  default_booking_mode?: 'time_slot' | 'date_range' | string;
  default_lead_time_hours?: number;
  max_advance_booking_days?: number;
  cancellation_window_hours?: number;
  hold_duration_minutes?: number;
  [key: string]: unknown;
}

export interface AgentDraftSchema {
  business_profile?: BusinessProfileData;
  operating_hours?: OperatingHoursData;
  scheduling_engine?: SchedulingEngineData;
  services?: Array<Partial<ServiceInfo>>;
  resources?: Array<Partial<ResourceInfo>>;
  guardrails?: GuardrailsData;
  widget_config?: Record<string, unknown>;
  runtime_meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OnboardingServiceItem extends Partial<ServiceInfo> {
  idx: number;
  assignedStaff: Array<Partial<ResourceInfo>>;
}

export interface OnboardingResourceItem extends Partial<ResourceInfo> {
  idx: number;
  initials: string;
  handledServices: Array<Partial<ServiceInfo>>;
}
