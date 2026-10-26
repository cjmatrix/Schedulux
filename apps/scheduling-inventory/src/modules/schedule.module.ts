import { Module } from '@nestjs/common';
import { TENANT_SCHEDULE_REPOSITORY } from '../domain/tokens.js';
import { MongoTenantScheduleRepository } from '../infrastructure/database/repositories/mongo-tenant-schedule.repository.js';

@Module({
  providers: [
    {
      provide: TENANT_SCHEDULE_REPOSITORY,
      useClass: MongoTenantScheduleRepository,
    },
  ],
  exports: [TENANT_SCHEDULE_REPOSITORY],
})
export class ScheduleModule {}
