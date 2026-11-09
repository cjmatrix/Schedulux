import type {
  GetTenantScheduleRequest,
  UpdateTenantScheduleRequest,
} from '@repo/proto/scheduling';
import type { ITenantScheduleDoc } from '../../infrastructure/database/schemas/tenant-schedule.schema.js';
import type { IUseCase } from './use-case.interface.js';

export const GET_TENANT_SCHEDULE_USE_CASE = 'IGetTenantScheduleUseCase';
export const UPDATE_TENANT_SCHEDULE_USE_CASE = 'IUpdateTenantScheduleUseCase';

export interface IGetTenantScheduleUseCase
  extends IUseCase<GetTenantScheduleRequest, ITenantScheduleDoc> {}

export interface IUpdateTenantScheduleUseCase
  extends IUseCase<UpdateTenantScheduleRequest, ITenantScheduleDoc> {}

