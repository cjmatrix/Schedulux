import { Injectable } from '@nestjs/common';
import type { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import {
  ITenantScheduleDoc,
  TenantScheduleModel,
} from '../schemas/tenant-schedule.schema.js';

@Injectable()
export class MongoTenantScheduleRepository implements ITenantScheduleRepository {
  async findByTenantAndAgent(
    tenantId: string,
    agentId?: string,
  ): Promise<ITenantScheduleDoc | null> {
    const query: Record<string, unknown> = { tenant_id: tenantId };
    if (agentId) {
      query.agent_id = agentId;
    }
    const doc = await TenantScheduleModel.findOne(query).exec();
    return doc;
  }

  async upsertSchedule(
    scheduleData: Partial<ITenantScheduleDoc> & { tenant_id: string; agent_id: string },
  ): Promise<ITenantScheduleDoc> {
    const id = scheduleData._id || `sched_${scheduleData.tenant_id}_${scheduleData.agent_id}`;
    const updatePayload: Record<string, unknown> = {
      ...scheduleData,
      _id: id,
      tenant_id: scheduleData.tenant_id,
      agent_id: scheduleData.agent_id,
    };

    const doc = await TenantScheduleModel.findOneAndUpdate(
      { tenant_id: scheduleData.tenant_id, agent_id: scheduleData.agent_id },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    return doc as ITenantScheduleDoc;
  }
}
