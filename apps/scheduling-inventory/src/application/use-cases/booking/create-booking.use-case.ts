import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingRequest } from '@repo/proto/scheduling';
import { RESPONSE_MESSAGES } from '../../../constants/index.js';
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
  BOOKING_ALLOCATION_SERVICE,
  BOOKING_REPOSITORY,
  CACHE_REPOSITORY,
  CUSTOMER_REPOSITORY,
  RESOURCE_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  TENANT_SCHEDULE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import type { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import {
  generateBookingReference,
  generateSemanticId,
} from '../../../domain/utils/id-generator.js';
import type { ICacheRepository } from '../../../infrastructure/cache/cache-repository.interface.js';
import type { IBookingAllocationService } from '../../interfaces/booking-allocation-service.interface.js';
import { ICreateBookingUseCase } from '../../interfaces/booking-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { getCachedService } from '../../utils/service-cache.helper.js';

@Injectable()
export class CreateBookingUseCase implements ICreateBookingUseCase {
  private readonly _logger = new Logger(CreateBookingUseCase.name);

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
    @Inject(BOOKING_ALLOCATION_SERVICE)
    private readonly _bookingAllocationService: IBookingAllocationService,
    @Inject(CACHE_REPOSITORY)
    private readonly _cacheRepo: ICacheRepository,
    @Inject(TENANT_SCHEDULE_REPOSITORY)
    private readonly _tenantScheduleRepository: ITenantScheduleRepository,
  ) {}

  async execute(dto: CreateBookingRequest): Promise<BookingEntity> {
    if (!dto.tenant_id?.trim())
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');
    if (!dto.service_id?.trim())
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.SERVICE_ID_REQUIRED);
    if (!dto.start_time)
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.START_TIME_REQUIRED);
    if (!dto.customer_phone?.trim())
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.CUSTOMER_PHONE_REQUIRED);

    const tenantId = dto.tenant_id.trim();
    const agentId = dto.agent_id.trim();
    const customerPhone = dto.customer_phone.trim();
    const customerEmail = dto.customer_email?.trim() || '';
    const customerName = dto.customer_name?.trim() || 'Guest';

    const [service, existingCustomerByPhone, tenantSchedule] = await Promise.all([
      getCachedService(this._serviceRepository, this._cacheRepo, tenantId, dto.service_id),
      this._customerRepository.findByPhone(tenantId, customerPhone, agentId),
      this._tenantScheduleRepository.findByTenantAndAgent(tenantId, agentId),
    ]);

    if (!service) {
      throw new NotFoundException(`Service ${dto.service_id} not found for tenant ${tenantId}`);
    }
    if (service.agentId?.trim() && agentId !== service.agentId.trim()) {
      throw new BadRequestException(
        `Service "${service.name}" (${dto.service_id}) belongs to agent ${service.agentId}, but request specified agent ${agentId}`,
      );
    }

    const interval = this._bookingAllocationService.calculateBookingInterval(
      service,
      dto.start_time,
      dto.end_time,
    );

    const leadTimeHours = tenantSchedule?.scheduling_engine?.default_lead_time_hours ?? 2;
    const maxAdvanceDays = tenantSchedule?.scheduling_engine?.max_advance_booking_days ?? 60;

    const minBookingTime = Date.now() + leadTimeHours * 3600 * 1000;
    const maxBookingTime = Date.now() + maxAdvanceDays * 24 * 3600 * 1000;

    if (interval.startTime.getTime() < minBookingTime) {
      throw new BadRequestException(
        `Bookings must be scheduled at least ${leadTimeHours} hour(s) in advance.`,
      );
    }

    if (interval.startTime.getTime() > maxBookingTime) {
      throw new BadRequestException(
        `Bookings cannot be scheduled more than ${maxAdvanceDays} days in advance.`,
      );
    }

    const [allocation, existingCustomerByEmail] = await Promise.all([
      this._bookingAllocationService.allocateResourcesForSlot({
        tenantId,
        agentId,
        service,
        effectiveStartTime: interval.effectiveStartTime,
        effectiveEndTime: interval.effectiveEndTime,
        explicitResourceIds: dto.resource_ids?.length
          ? dto.resource_ids
          : dto.resource_id
            ? [dto.resource_id]
            : [],
        resourceRepository: this._resourceRepository,
        bookingRepository: this._bookingRepository,
      }),
      !existingCustomerByPhone && customerEmail
        ? this._customerRepository.findByEmail(tenantId, customerEmail, agentId)
        : Promise.resolve(null),
    ]);

    const { allocatedResourceIds, assignedAssetIds } = allocation;
    const { startTime, endTime, effectiveEndTime, bufferMinutes, durationMinutes, bookingMode } =
      interval;

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

    this._eventsProducer.publishOutboxEvent(outboxDoc).catch((err: unknown) => {
      this._logger.error(
        `Immediate outbox dispatch failed for booking ${createdBooking.id}: ${err}. Recovery sweeper will retry.`,
      );
    });

    return createdBooking;
  }
}
