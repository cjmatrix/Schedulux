import { Inject, Injectable, Logger } from '@nestjs/common';
import type { UpdateTenantScheduleRequest } from '@repo/proto/scheduling';
import type { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  SCHEDULING_EVENTS_PRODUCER,
  TENANT_SCHEDULE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import type { ITenantScheduleDoc } from '../../../infrastructure/database/schemas/tenant-schedule.schema.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import type { IUpdateTenantScheduleUseCase } from '../../interfaces/schedule-use-cases.interface.js';

@Injectable()
export class UpdateTenantScheduleUseCase implements IUpdateTenantScheduleUseCase {
  private readonly _logger = new Logger(UpdateTenantScheduleUseCase.name);

  constructor(
    @Inject(TENANT_SCHEDULE_REPOSITORY)
    private readonly _tenantScheduleRepository: ITenantScheduleRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: UpdateTenantScheduleRequest): Promise<ITenantScheduleDoc> {
    const updatePayload: Partial<ITenantScheduleDoc> & { tenant_id: string; agent_id: string } = {
      tenant_id: dto.tenant_id,
      agent_id: dto.agent_id,
    };

    if (dto.timezone !== undefined) {
      updatePayload.timezone = dto.timezone;
    }
    if (dto.currency !== undefined) {
      updatePayload.currency = dto.currency;
    }
    if (dto.operating_hours) {
      updatePayload.operating_hours = {
        monday: (dto.operating_hours.monday || []).map((i) => ({ start: i.start, end: i.end })),
        tuesday: (dto.operating_hours.tuesday || []).map((i) => ({ start: i.start, end: i.end })),
        wednesday: (dto.operating_hours.wednesday || []).map((i) => ({ start: i.start, end: i.end })),
        thursday: (dto.operating_hours.thursday || []).map((i) => ({ start: i.start, end: i.end })),
        friday: (dto.operating_hours.friday || []).map((i) => ({ start: i.start, end: i.end })),
        saturday: (dto.operating_hours.saturday || []).map((i) => ({ start: i.start, end: i.end })),
        sunday: (dto.operating_hours.sunday || []).map((i) => ({ start: i.start, end: i.end })),
      };
    }
    if (dto.blackout_dates) {
      updatePayload.blackout_dates = dto.blackout_dates.map((b) => ({
        date: b.date,
        reason: b.reason || '',
        is_closed: b.is_closed ?? true,
      }));
    }
    if (dto.scheduling_engine) {
      updatePayload.scheduling_engine = {
        booking_mode:
          (dto.scheduling_engine.booking_mode as 'time_slot' | 'date_range') || 'time_slot',
        default_lead_time_hours: dto.scheduling_engine.default_lead_time_hours ?? 2,
        max_advance_booking_days: dto.scheduling_engine.max_advance_booking_days ?? 60,
        cancellation_window_hours: dto.scheduling_engine.cancellation_window_hours ?? 24,
        hold_duration_minutes: dto.scheduling_engine.hold_duration_minutes ?? 10,
      };
    }
    if (dto.verification_policy) {
      updatePayload.verification_policy = {
        require_otp_for_new_booking:
          dto.verification_policy.require_otp_for_new_booking ?? false,
      };
    }


    const { updated, outbox } = await this._unitOfWork.withTransaction(async () => {
      const updatedDoc = await this._tenantScheduleRepository.upsertSchedule(updatePayload);
      const outboxDoc = await this._eventsProducer.createScheduleUpdatedOutboxEvent(updatedDoc);
      return { updated: updatedDoc, outbox: outboxDoc };
    });

  
    void this._eventsProducer.publishOutboxEvent(outbox).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.error(
        `Immediate Kafka event dispatch failed for schedule ${dto.tenant_id}:${dto.agent_id}: ${msg}. Recovery poller will retry.`,
      );
    });

    return updated;
  }
}
