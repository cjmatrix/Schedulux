import type { ITenantScheduleDoc } from '../../infrastructure/database/schemas/tenant-schedule.schema.js';

export interface ITenantScheduleRepository {
  findByTenantAndAgent(
    tenantId: string,
    agentId?: string,
  ): Promise<ITenantScheduleDoc | null>;

  upsertSchedule(
    scheduleData: Partial<ITenantScheduleDoc> & { tenant_id: string; agent_id: string },
  ): Promise<ITenantScheduleDoc>;
}
