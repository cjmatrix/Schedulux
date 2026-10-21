import type { ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import type { GuardrailsData } from './components/SecurityGuardrailsCard.js';

export type { GuardrailsData };

export interface Message {
  id: string;
  role: 'agent' | 'tenant';
  text: string;
}

export type RightViewMode = 'rules' | 'sandbox' | 'json';

export type CanvasModule = 'all' | 'profile' | 'services' | 'resources' | 'guardrails';

export interface BusinessProfileData {
  name?: string;
  clinic_name?: string;
  timezone?: string;
  currency?: string;
  industry?: string;
  vertical?: string;
  address?: string;
  description?: string;
  [key: string]: unknown;
}

export interface TimeSlot {
  start?: string;
  end?: string;
}

export type OperatingHoursData = Record<string, TimeSlot[]>;

export interface AgentDraftSchema {
  business_profile?: BusinessProfileData;
  operating_hours?: OperatingHoursData;
  services?: Array<Partial<ServiceInfo>>;
  resources?: Array<Partial<ResourceInfo>>;
  guardrails?: GuardrailsData;
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
