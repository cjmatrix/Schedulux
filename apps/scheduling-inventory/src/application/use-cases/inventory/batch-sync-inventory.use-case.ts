import { Inject, Injectable, Logger } from '@nestjs/common';
import { BatchSyncInventoryRequest, BatchSyncInventoryResponse } from '@repo/proto/scheduling';
import {
  DispatchStatus,
  ResourceEntity,
  ResourceType,
} from '../../../domain/entities/resource.entity.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import {
  RESOURCE_REPOSITORY,
  SERVICE_REPOSITORY,
  TENANT_SCHEDULE_REPOSITORY,
} from '../../../domain/tokens.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { ResourceMapper } from '../../../infrastructure/database/mappers/resource.mapper.js';
import { ServiceMapper } from '../../../infrastructure/database/mappers/service.mapper.js';
import { IBatchSyncInventoryUseCase } from '../../interfaces/batch-sync-use-case.interface.js';

@Injectable()
export class BatchSyncInventoryUseCase implements IBatchSyncInventoryUseCase {
  private readonly logger = new Logger(BatchSyncInventoryUseCase.name);

  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(TENANT_SCHEDULE_REPOSITORY)
    private readonly tenantScheduleRepository: ITenantScheduleRepository,
  ) {}

  async execute(dto: BatchSyncInventoryRequest): Promise<BatchSyncInventoryResponse> {
    const tenantId = dto.tenant_id;
    const agentId = dto.agent_id || '';

    if (!tenantId) {
      return {
        resources: [],
        services: [],
        success: false,
        message: 'Missing tenant_id',
      };
    }

    this.logger.log(
      `Starting BatchSyncInventory for tenant: ${tenantId}, agent: ${agentId} (${dto.resources.length} resources, ${dto.services.length} services)`,
    );

    const [existingResources, existingServices] = await Promise.all([
      this.resourceRepository.findByTenant(tenantId, agentId || undefined),
      this.serviceRepository.findByTenant(tenantId, agentId || undefined),
    ]);

    const existingResById = new Map(existingResources.map((r) => [r.id, r]));
    const existingResByName = new Map(
      existingResources.map((r) => [r.name.trim().toLowerCase(), r]),
    );

    const existingSvcById = new Map(existingServices.map((s) => [s.id, s]));
    const existingSvcByName = new Map(
      existingServices.map((s) => [s.name.trim().toLowerCase(), s]),
    );

    const resourceEntities: ResourceEntity[] = [];
    const resourceIdMap = new Map<string, string>();

    for (const r of dto.resources) {
      const nameKey = (r.name || '').trim().toLowerCase();
      const existing =
        (r.resource_id && existingResById.get(r.resource_id)) || existingResByName.get(nameKey);
      const resourceId = existing ? existing.id : generateSemanticId('res', r.name);

      const entity = new ResourceEntity({
        id: resourceId,
        tenantId,
        agentId,
        resourceType: (r.resource_type as ResourceType) || 'staff',
        name: r.name,
        title: r.title || '',
        category: r.category || 'General',
        description: r.description || '',
        isBookable: r.is_bookable !== undefined ? r.is_bookable : true,
        dispatchStatus: (r.dispatch_status as DispatchStatus) || 'active',
        customShiftOverridesJson: r.custom_shift_overrides_json || '{}',
      });

      resourceEntities.push(entity);

      if (r.resource_id) {
        resourceIdMap.set(r.resource_id, resourceId);
      }
      resourceIdMap.set(r.name, resourceId);
      resourceIdMap.set(nameKey, resourceId);
    }

    if (resourceEntities.length > 0) {
      await this.resourceRepository.bulkUpsert(resourceEntities);
    }

    const serviceEntities: ServiceEntity[] = [];

    for (const s of dto.services) {
      const nameKey = (s.name || '').trim().toLowerCase();
      const existing =
        (s.service_id && existingSvcById.get(s.service_id)) || existingSvcByName.get(nameKey);
      const serviceId = existing ? existing.id : generateSemanticId('srv', s.name);

      const mappedRequirements = (s.resource_requirements || []).map((req) => {
        const reqEligible: string[] = [];
        for (const rawRid of req.eligible_resource_ids || []) {
          const mapped =
            resourceIdMap.get(rawRid) || resourceIdMap.get(rawRid.trim().toLowerCase()) || rawRid;
          if (!reqEligible.includes(mapped)) {
            reqEligible.push(mapped);
          }
        }
        return {
          role: req.role || 'Staff',
          resourceType: req.resource_type || 'staff',
          count: req.count || 1,
          eligibleResourceIds: reqEligible,
          selectionMode:
            (req.selection_mode as 'user_selectable' | 'auto_assign') ||
            (req.resource_type === 'staff' ? 'user_selectable' : 'auto_assign'),
        };
      });

      const price = PriceVO.create(s.price?.type, s.price?.amount, s.price?.currency);
      const deposit = DepositVO.create({
        required: s.deposit?.required,
        amount: s.deposit?.amount,
        processor: s.deposit?.processor,
        upiId: s.deposit?.upi_id,
        qrCodeUrl: s.deposit?.qr_code_url,
        confirmationMethod: s.deposit?.confirmation_method,
        paymentInstructions: s.deposit?.payment_instructions,
      });

      const entity = new ServiceEntity({
        id: serviceId,
        tenantId,
        agentId,
        name: s.name,
        category: s.category || 'General',
        description: s.description || '',
        durationMinutes: s.duration_minutes || 30,
        bufferMinutes: s.buffer_minutes || 0,
        bookingMode: s.booking_mode || 'time_slot',
        price,
        deposit,
        verification: s.verification ? { require_otp: s.verification.require_otp } : undefined,
        resourceRequirements: mappedRequirements,
        recallIntervalDays: s.recall_interval_days || 0,
      });

      serviceEntities.push(entity);
    }

    if (serviceEntities.length > 0) {
      await this.serviceRepository.bulkUpsert(serviceEntities);
    }

    if (dto.operating_hours || dto.timezone || dto.blackout_dates || dto.scheduling_engine) {
      try {
        await this.tenantScheduleRepository.upsertSchedule({
          tenant_id: tenantId,
          agent_id: agentId,
          timezone: dto.timezone || 'UTC',
          currency: dto.currency || 'USD',
          operating_hours: dto.operating_hours
            ? {
                monday: dto.operating_hours.monday || [],
                tuesday: dto.operating_hours.tuesday || [],
                wednesday: dto.operating_hours.wednesday || [],
                thursday: dto.operating_hours.thursday || [],
                friday: dto.operating_hours.friday || [],
                saturday: dto.operating_hours.saturday || [],
                sunday: dto.operating_hours.sunday || [],
              }
            : {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: [],
              },
          blackout_dates: (dto.blackout_dates || []).map((b) => ({
            date: b.date,
            reason: b.reason || '',
            is_closed: b.is_closed,
          })),
          scheduling_engine: dto.scheduling_engine
            ? {
                booking_mode:
                  (dto.scheduling_engine.booking_mode as 'time_slot' | 'date_range') || 'time_slot',
                default_lead_time_hours: dto.scheduling_engine.default_lead_time_hours ?? 2,
                max_advance_booking_days: dto.scheduling_engine.max_advance_booking_days ?? 60,
                cancellation_window_hours: dto.scheduling_engine.cancellation_window_hours ?? 24,
                hold_duration_minutes: dto.scheduling_engine.hold_duration_minutes ?? 10,
              }
            : {
                booking_mode: 'time_slot',
                default_lead_time_hours: 2,
                max_advance_booking_days: 60,
                cancellation_window_hours: 24,
                hold_duration_minutes: 10,
              },
          verification_policy: dto.verification_policy
            ? {
                require_otp_for_new_booking: !!dto.verification_policy.require_otp_for_new_booking,
                require_otp_for_reschedule: dto.verification_policy.require_otp_for_reschedule ?? true,
                require_otp_for_cancel: dto.verification_policy.require_otp_for_cancel ?? true,
              }
            : {
                require_otp_for_new_booking: false,
                require_otp_for_reschedule: true,
                require_otp_for_cancel: true,
              },
        });
        this.logger.log(`Synced tenant schedule settings for agent ${agentId}`);
      } catch (scheduleErr) {
        this.logger.error('Failed to sync tenant schedule settings:', scheduleErr);
      }
    }

    this.logger.log(
      `BatchSyncInventory completed successfully: ${resourceEntities.length} resources, ${serviceEntities.length} services synced.`,
    );

    return {
      resources: resourceEntities.map((r) => ResourceMapper.toProto(r)),
      services: serviceEntities.map((s) => ServiceMapper.toProto(s)),
      success: true,
      message: `Batch sync completed: ${resourceEntities.length} resources, ${serviceEntities.length} services`,
    };
  }
}
