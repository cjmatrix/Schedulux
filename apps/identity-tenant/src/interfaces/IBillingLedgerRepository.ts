import { IBillingLedger } from '../model/BillingLedger.js';

export interface RecordBillingLedgerInput {
  _id?: string;
  tenant_id: string;
  event_type: string;
  event_id: string;
  provider?: 'paddle' | 'stripe' | 'manual';
  amount?: number;
  currency?: string;
  tier?: string;
  status: string;
  paddle_customer_id?: string;
  paddle_subscription_id?: string;
  paddle_transaction_id?: string;
  details?: Record<string, unknown>;
}

export interface IBillingLedgerRepository {
  recordEntry(input: RecordBillingLedgerInput): Promise<IBillingLedger>;
  findByEventId(eventId: string): Promise<IBillingLedger | null>;
  findByTenantId(tenantId: string, limit?: number): Promise<IBillingLedger[]>;
}

