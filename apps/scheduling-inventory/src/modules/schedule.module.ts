import { Module } from '@nestjs/common';
import {
  GET_TENANT_SCHEDULE_USE_CASE,
  UPDATE_TENANT_SCHEDULE_USE_CASE,
} from '../application/interfaces/schedule-use-cases.interface.js';
import { GetTenantScheduleUseCase } from '../application/use-cases/schedule/get-tenant-schedule.use-case.js';
import { UpdateTenantScheduleUseCase } from '../application/use-cases/schedule/update-tenant-schedule.use-case.js';
import { TENANT_SCHEDULE_REPOSITORY } from '../domain/tokens.js';
import { MongoTenantScheduleRepository } from '../infrastructure/database/repositories/mongo-tenant-schedule.repository.js';

@Module({
  providers: [
    {
      provide: TENANT_SCHEDULE_REPOSITORY,
      useClass: MongoTenantScheduleRepository,
    },
    {
      provide: GET_TENANT_SCHEDULE_USE_CASE,
      useClass: GetTenantScheduleUseCase,
    },
    {
      provide: UPDATE_TENANT_SCHEDULE_USE_CASE,
      useClass: UpdateTenantScheduleUseCase,
    },
  ],
  exports: [
    TENANT_SCHEDULE_REPOSITORY,
    GET_TENANT_SCHEDULE_USE_CASE,
    UPDATE_TENANT_SCHEDULE_USE_CASE,
  ],
})
export class ScheduleModule {}
