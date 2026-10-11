export interface SchemaGeneratedEvent {
  event: string;
  tenant_id: string;
  job_id: string;
  url: string;
  schema: any;
  timestamp?: string;
}

export interface ISchemaEventSubscriber {
  onSchemaGenerated(callback: (event: SchemaGeneratedEvent) => void): void;
}

export interface ISchemaCacheService {
  getDraftSchema(tenantId: string, jobId?: string): Promise<any | null>;
}
