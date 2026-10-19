export interface Message {
  id: string;
  role: 'agent' | 'tenant';
  text: string;
}

export type RightViewMode = 'rules' | 'sandbox' | 'json';

export type CanvasModule = 'all' | 'profile' | 'services' | 'resources' | 'guardrails';
