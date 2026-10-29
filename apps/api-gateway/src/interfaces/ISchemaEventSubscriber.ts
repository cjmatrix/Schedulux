export interface SchemaGeneratedEvent {
  event: string;
  tenant_id: string;
  job_id: string;
  url: string;
  schema?: Record<string, unknown>;
  error?: string;
  timestamp?: string;
}

export interface ISchemaEventSubscriber {
  onSchemaGenerated(callback: (event: SchemaGeneratedEvent) => void): void;
}

export interface ISchemaCacheService {
  getDraftSchema(tenantId: string, jobId?: string): Promise<Record<string, unknown> | null>;
}

