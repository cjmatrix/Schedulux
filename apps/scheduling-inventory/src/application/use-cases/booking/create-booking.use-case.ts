import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingRequest } from '@repo/proto/scheduling';
import {
  BookingDepositStatus,
  BookingEntity,
  BookingMode,
  BookingSource,
} from '../../../domain/entities/booking.entity.js';
import { CustomerEntity } from '../../../domain/entities/customer.entity.js';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import { IBookingRepository } from '../../../domain/repositories/booking.repository.interface.js';
import { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  BOOKING_REPOSITORY,
  CUSTOMER_REPOSITORY,
  RESOURCE_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import { generateBookingReference, generateSemanticId } from '../../../domain/utils/id-generator.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { ICreateBookingUseCase } from '../../interfaces/booking-use-cases.interface.js';
import { RESPONSE_MESSAGES } from '../../../constants/index.js';

@Injectable()
export class CreateBookingUseCase implements ICreateBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly _bookingRepository: IBookingRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly _customerRepository: ICustomerRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateBookingRequest): Promise<BookingEntity> {
    if (!dto.tenant_id?.trim()) throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');
    if (!dto.service_id?.trim()) throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.SERVICE_ID_REQUIRED);
    if (!dto.start_time) throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.START_TIME_REQUIRED);
    if (!dto.customer_phone?.trim()) throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.CUSTOMER_PHONE_REQUIRED);

    const tenantId = dto.tenant_id.trim();
    const agentId = dto.agent_id.trim();
    const customerPhone = dto.customer_phone.trim();
    const customerEmail = dto.customer_email?.trim() || '';
    const customerName = dto.customer_name?.trim() || 'Guest';

    const [service, existingCustomerByPhone] = await Promise.all([
      this._serviceRepository.findById(tenantId, dto.service_id),
      this._customerRepository.findByPhone(tenantId, customerPhone, agentId),
    ]);

    if (!service) {
      throw new NotFoundException(`Service ${dto.service_id} not found for tenant ${tenantId}`);
    }
    if (
      service.agentId?.trim() &&
      agentId !== service.agentId.trim()
    ) {
      throw new BadRequestException(
        `Service "${service.name}" (${dto.service_id}) belongs to agent ${service.agentId}, but request specified agent ${agentId}`,
      );
    }

    const startTime = new Date(dto.start_time);
    if (isNaN(startTime.getTime())) throw new BadRequestException('Invalid start_time format');

    const bookingMode = (service.bookingMode as BookingMode) || 'time_slot';
    let endTime: Date;
    let durationMinutes: number;

    if (bookingMode === 'date_range') {
      if (!dto.end_time) {
        throw new BadRequestException('end_time (check-out date) is required for date_range bookings');
      }
      endTime = new Date(dto.end_time);
      if (isNaN(endTime.getTime())) throw new BadRequestException('Invalid end_time format for date_range');
      if (startTime >= endTime) throw new BadRequestException('Check-out end_time must be after check-in start_time');
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
    } else {
      if (dto.end_time) {
        endTime = new Date(dto.end_time);
        if (isNaN(endTime.getTime())) throw new BadRequestException('Invalid end_time format');
        durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)));
      } else {
        durationMinutes = service.durationMinutes || 30;
        endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      }
      if (startTime >= endTime) throw new BadRequestException('Booking start time must be before end time');
    }

    const bufferMinutes = service.bufferMinutes || 0;
    const effectiveStartTime = startTime;
    const effectiveEndTime = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);

    
    const explicitResourceIds: string[] = [];
    if (dto.resource_ids?.length) {
      for (const id of dto.resource_ids) {
        const trimmed = id?.trim();
        if (trimmed && !explicitResourceIds.includes(trimmed)) explicitResourceIds.push(trimmed);
      }
    } else if (dto.resource_id?.trim()) {
      explicitResourceIds.push(dto.resource_id.trim());
    }

    const requirements = service.getEffectiveResourceRequirements();
    const allCandidateIdsSet = new Set<string>(explicitResourceIds);
    for (const req of requirements) {
      if (req.eligibleResourceIds?.length) {
        for (const id of req.eligibleResourceIds) allCandidateIdsSet.add(id);
      }
    }
    const allCandidateIds = Array.from(allCandidateIdsSet);
    
    const [rawActiveResources, busyResourceIds, existingCustomerByEmail] = await Promise.all([
      allCandidateIds.length > 0
        ? this._resourceRepository.findActiveBookableByIds(tenantId, allCandidateIds, agentId)
        : Promise.resolve([]),
      allCandidateIds.length > 0
        ? this._bookingRepository.findBusyResourceIds(tenantId, allCandidateIds, effectiveStartTime, effectiveEndTime)
        : Promise.resolve(new Set<string>()),
      !existingCustomerByPhone && customerEmail
        ? this._customerRepository.findByEmail(tenantId, customerEmail, agentId)
        : Promise.resolve(null),
    ]);


    const activeResourceMap = new Map<string, ResourceEntity>();
    for (const res of rawActiveResources) {
      if (res.isBookable && res.dispatchStatus === 'active') {
        activeResourceMap.set(res.id, res);
      }
    }

    const allocatedResourceIds: string[] = [];
    const assignedAssetIds: string[] = [];
    const usedResourceIds = new Set<string>();

    for (const req of requirements) {
      const requiredCount = Math.max(1, req.count || 1);
      const eligiblePool = req.eligibleResourceIds || [];

      const matchingExplicit = explicitResourceIds.filter(
        (id) => eligiblePool.includes(id) && !usedResourceIds.has(id),
      );

      for (const id of matchingExplicit) {
        const res = activeResourceMap.get(id);
        if (!res) {
          throw new BadRequestException(
            `Selected resource (${id}) for role "${req.role}" is currently inactive, on leave, or not bookable`,
          );
        }
        if (busyResourceIds.has(id)) {
          throw new ConflictException(
            `Resource "${res.name || 'Resource'}" for role "${req.role}" is already booked for this time slot`,
          );
        }
        allocatedResourceIds.push(id);
        usedResourceIds.add(id);
        if (req.resourceType !== 'staff') assignedAssetIds.push(id);
      }

      const remainingNeeded = requiredCount - matchingExplicit.length;
      if (remainingNeeded > 0) {
        const candidates = eligiblePool.filter((id) => !usedResourceIds.has(id));
        if (candidates.length === 0) {
          throw new ConflictException(
            `Not enough eligible resources configured to satisfy requirement for role "${req.role}" (requires ${requiredCount})`,
          );
        }

        const activeCandidates = candidates
          .map((id) => activeResourceMap.get(id))
          .filter((res): res is ResourceEntity => res !== undefined);

        if (activeCandidates.length < remainingNeeded) {
          throw new ConflictException(
            `Not enough active/bookable resources available for role "${req.role}". Required: ${requiredCount}, Available active: ${activeCandidates.length + matchingExplicit.length}`,
          );
        }

        const freeCandidates = activeCandidates.filter((c) => !busyResourceIds.has(c.id));
        if (freeCandidates.length < remainingNeeded) {
          throw new ConflictException(
            `Conflict: Not enough available resources for role "${req.role}" (${requiredCount} required, only ${freeCandidates.length + matchingExplicit.length} available for this slot)`,
          );
        }

        for (let i = 0; i < remainingNeeded; i++) {
          const chosen = freeCandidates[i];
          allocatedResourceIds.push(chosen.id);
          usedResourceIds.add(chosen.id);
          if (req.resourceType !== 'staff') assignedAssetIds.push(chosen.id);
        }
      }
    }

    const leftoverExplicit = explicitResourceIds.filter((id) => !usedResourceIds.has(id));
    if (leftoverExplicit.length > 0) {
      throw new BadRequestException(
        `Resource(s) not eligible for service "${service.name}" or requirement count exceeded: ${leftoverExplicit.join(', ')}`,
      );
    }


    let customer = existingCustomerByPhone || existingCustomerByEmail;
    const isExistingCustomer = Boolean(customer);

    if (customer) {
      customer.updateDetails({
        name: customerName,
        email: customerEmail || customer.email,
        notes: dto.notes?.trim() || customer.notes,
      });
      customer.incrementBookings();
    } else {
      customer = new CustomerEntity({
        id: generateSemanticId('cus', customerName),
        tenantId,
        agentId: agentId || '',
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        notes: dto.notes?.trim() || '',
        isGuest: true,
        totalBookings: 1,
      });
    }

    const source: BookingSource = (dto.source as BookingSource) || 'manual';
    const depositStatus: BookingDepositStatus = dto.deposit_status
      ? (dto.deposit_status as BookingDepositStatus)
      : service.deposit.required
        ? 'pending'
        : 'not_required';

    const booking = new BookingEntity({
      id: generateSemanticId('bk', service.name),
      bookingReference: generateBookingReference(),
      tenantId,
      agentId: agentId || '',
      serviceId: service.id,
      resourceId: allocatedResourceIds[0] || null,
      resourceIds: allocatedResourceIds,
      assignedAssetIds,
      customerId: customer.id,
      customerSnapshot: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      bookingMode,
      startTime,
      endTime,
      effectiveEndTime,
      bufferMinutes,
      durationMinutes,
      source,
      status: 'confirmed',
      depositStatus,
      price: service.price,
      deposit: service.deposit,
      notes: dto.notes?.trim() || '',
      createdBy: dto.created_by?.trim() || '',
    });

   
    const { createdBooking, outboxDoc } = await this._unitOfWork.withTransaction(async () => {
      if (isExistingCustomer) {
        await this._customerRepository.update(customer);
      } else {
        await this._customerRepository.create(customer);
      }

      const createdEntity = await this._bookingRepository.create(booking);
      const outbox = await this._eventsProducer.createBookingCreatedOutboxEvent(createdEntity);

      return { createdBooking: createdEntity, outboxDoc: outbox };
    });

    this._eventsProducer.publishOutboxEvent(outboxDoc).catch((err) => {
      console.error(`Async outbox publish failed for booking ${createdBooking.id}:`, err);
    });

    return createdBooking;
  }
}
