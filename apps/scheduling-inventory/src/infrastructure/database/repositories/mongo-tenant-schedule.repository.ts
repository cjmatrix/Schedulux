import { Inject, Injectable, Optional } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import type { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import { UNIT_OF_WORK } from '../../../domain/tokens.js';
import { ITenantScheduleDoc, TenantScheduleModel } from '../schemas/tenant-schedule.schema.js';

@Injectable()
export class MongoTenantScheduleRepository implements ITenantScheduleRepository {
  constructor(
    @Optional()
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork?: IUnitOfWork,
  ) {}

  async findByTenantAndAgent(
    tenantId: string,
    agentId?: string,
  ): Promise<ITenantScheduleDoc | null> {
    const query: Record<string, unknown> = { tenant_id: tenantId };
    if (agentId) {
      query.agent_id = agentId;
    }
    const doc = await TenantScheduleModel.findOne(query).lean().exec();
    return doc as unknown as ITenantScheduleDoc | null;
  }

  async upsertSchedule(
    scheduleData: Partial<ITenantScheduleDoc> & { tenant_id: string; agent_id: string },
    explicitSession?: ClientSession,
  ): Promise<ITenantScheduleDoc> {
    const session = explicitSession || this._unitOfWork?.getSession();
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
      { upsert: true, new: true, setDefaultsOnInsert: true, session },
    ).exec();

    return doc as ITenantScheduleDoc;
  }
}
