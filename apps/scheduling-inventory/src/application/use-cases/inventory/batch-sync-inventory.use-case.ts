import { Inject, Injectable, Logger } from '@nestjs/common';
import { RESOURCE_REPOSITORY, SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ResourceEntity, ResourceType, DispatchStatus } from '../../../domain/entities/resource.entity.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { IBatchSyncInventoryUseCase } from '../../interfaces/batch-sync-use-case.interface.js';
import { BatchSyncInventoryRequest, BatchSyncInventoryResponse } from '@repo/proto/scheduling';
import { ResourceMapper } from '../../../infrastructure/database/mappers/resource.mapper.js';
import { ServiceMapper } from '../../../infrastructure/database/mappers/service.mapper.js';

@Injectable()
export class BatchSyncInventoryUseCase implements IBatchSyncInventoryUseCase {
  private readonly logger = new Logger(BatchSyncInventoryUseCase.name);

  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
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
    const existingResByName = new Map(existingResources.map((r) => [r.name.trim().toLowerCase(), r]));

    const existingSvcById = new Map(existingServices.map((s) => [s.id, s]));
    const existingSvcByName = new Map(existingServices.map((s) => [s.name.trim().toLowerCase(), s]));

   
    const resourceEntities: ResourceEntity[] = [];
    const resourceIdMap = new Map<string, string>();

    for (const r of dto.resources) {
      const nameKey = (r.name || '').trim().toLowerCase();
      const existing = (r.resource_id && existingResById.get(r.resource_id)) || existingResByName.get(nameKey);
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
      const existing = (s.service_id && existingSvcById.get(s.service_id)) || existingSvcByName.get(nameKey);
      const serviceId = existing ? existing.id : generateSemanticId('srv', s.name);

      // Remap eligible resource IDs
      const canonicalEligible: string[] = [];
      for (const rawRid of s.eligible_resource_ids || []) {
        const mapped = resourceIdMap.get(rawRid) || resourceIdMap.get(rawRid.trim().toLowerCase()) || rawRid;
        if (!canonicalEligible.includes(mapped)) {
          canonicalEligible.push(mapped);
        }
      }

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
        allocationModel: s.allocation_model || 'single_resource',
        bookingMode: s.booking_mode || 'time_slot',
        price,
        deposit,
        eligibleResourceIds: canonicalEligible,
        requiredAssetIds: s.required_asset_ids ?? [],
        recallIntervalDays: s.recall_interval_days || 0,
      });

      serviceEntities.push(entity);
    }

    if (serviceEntities.length > 0) {
      await this.serviceRepository.bulkUpsert(serviceEntities);
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
