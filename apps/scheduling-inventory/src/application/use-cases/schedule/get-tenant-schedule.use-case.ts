import { Inject, Injectable } from '@nestjs/common';
import type { GetTenantScheduleRequest } from '@repo/proto/scheduling';
import type { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import { TENANT_SCHEDULE_REPOSITORY } from '../../../domain/tokens.js';
import type { ITenantScheduleDoc } from '../../../infrastructure/database/schemas/tenant-schedule.schema.js';
import type { IGetTenantScheduleUseCase } from '../../interfaces/schedule-use-cases.interface.js';

@Injectable()
export class GetTenantScheduleUseCase implements IGetTenantScheduleUseCase {
  constructor(
    @Inject(TENANT_SCHEDULE_REPOSITORY)
    private readonly _tenantScheduleRepository: ITenantScheduleRepository,
  ) {}

  async execute(dto: GetTenantScheduleRequest): Promise<ITenantScheduleDoc> {
    const existing = await this._tenantScheduleRepository.findByTenantAndAgent(
      dto.tenant_id,
      dto.agent_id,
    );

    if (existing) {
      return existing;
    }

  
    const defaultSchedule: Partial<ITenantScheduleDoc> & { tenant_id: string; agent_id: string } =
      {
        _id: `sched_${dto.tenant_id}_${dto.agent_id}`,
        tenant_id: dto.tenant_id,
        agent_id: dto.agent_id,
        timezone: 'UTC',
        currency: 'USD',
        operating_hours: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '17:00' }],
          saturday: [],
          sunday: [],
        },
        blackout_dates: [],
        scheduling_engine: {
          booking_mode: 'time_slot',
          default_lead_time_hours: 2,
          max_advance_booking_days: 60,
          cancellation_window_hours: 24,
          hold_duration_minutes: 10,
        },
        verification_policy: {
          require_otp_for_new_booking: false,
        },
      };

    return this._tenantScheduleRepository.upsertSchedule(defaultSchedule);
  }
}
