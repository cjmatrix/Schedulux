import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  BatchSyncInventoryRequest,
  BatchSyncInventoryResponse,
  BookingResponse,
  CancelBookingRequest,
  CreateBookingRequest,
  CreateResourceRequest,
  CreateServiceRequest,
  DeleteResourceRequest,
  DeleteResourceResponse,
  DeleteServiceRequest,
  DeleteServiceResponse,
  GetAvailabilityRequest,
  GetAvailabilityResponse,
  GetResourceRequest,
  GetServiceRequest,
  ListBookingsRequest,
  ListBookingsResponse,
  ListResourcesRequest,
  ListResourcesResponse,
  ListServicesRequest,
  ListServicesResponse,
  RescheduleBookingRequest,
  ResourceResponse,
  ServiceResponse,
  UpdateResourceRequest,
  UpdateServiceRequest,
} from '@repo/proto/scheduling';
import {
  BATCH_SYNC_INVENTORY_USE_CASE,
  IBatchSyncInventoryUseCase,
} from '../../application/interfaces/batch-sync-use-case.interface.js';
import {
  CANCEL_BOOKING_USE_CASE,
  CREATE_BOOKING_USE_CASE,
  GET_AVAILABILITY_USE_CASE,
  ICancelBookingUseCase,
  ICreateBookingUseCase,
  IGetAvailabilityUseCase,
  IListBookingsUseCase,
  IRescheduleBookingUseCase,
  LIST_BOOKINGS_USE_CASE,
  RESCHEDULE_BOOKING_USE_CASE,
} from '../../application/interfaces/booking-use-cases.interface.js';
import {
  CREATE_RESOURCE_USE_CASE,
  DELETE_RESOURCE_USE_CASE,
  GET_RESOURCE_USE_CASE,
  ICreateResourceUseCase,
  IDeleteResourceUseCase,
  IGetResourceUseCase,
  IListResourcesUseCase,
  IUpdateResourceUseCase,
  LIST_RESOURCES_USE_CASE,
  UPDATE_RESOURCE_USE_CASE,
} from '../../application/interfaces/resource-use-cases.interface.js';
import {
  CREATE_SERVICE_USE_CASE,
  DELETE_SERVICE_USE_CASE,
  GET_SERVICE_USE_CASE,
  ICreateServiceUseCase,
  IDeleteServiceUseCase,
  IGetServiceUseCase,
  IListServicesUseCase,
  IUpdateServiceUseCase,
  LIST_SERVICES_USE_CASE,
  UPDATE_SERVICE_USE_CASE,
} from '../../application/interfaces/service-use-cases.interface.js';
import { GRPC_METHODS, GRPC_SERVICES, RESPONSE_MESSAGES } from '../../constants/index.js';
import { BookingMapper } from '../../infrastructure/database/mappers/booking.mapper.js';
import { ResourceMapper } from '../../infrastructure/database/mappers/resource.mapper.js';
import { ServiceMapper } from '../../infrastructure/database/mappers/service.mapper.js';
import { GrpcExceptionFilter } from './grpc-exception.filter.js';

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class SchedulingInventoryGrpcController {
  constructor(
    @Inject(CREATE_SERVICE_USE_CASE)
    private readonly _createServiceUseCase: ICreateServiceUseCase,
    @Inject(GET_SERVICE_USE_CASE)
    private readonly _getServiceUseCase: IGetServiceUseCase,
    @Inject(LIST_SERVICES_USE_CASE)
    private readonly _listServicesUseCase: IListServicesUseCase,
    @Inject(UPDATE_SERVICE_USE_CASE)
    private readonly _updateServiceUseCase: IUpdateServiceUseCase,
    @Inject(DELETE_SERVICE_USE_CASE)
    private readonly _deleteServiceUseCase: IDeleteServiceUseCase,
    @Inject(CREATE_RESOURCE_USE_CASE)
    private readonly _createResourceUseCase: ICreateResourceUseCase,
    @Inject(GET_RESOURCE_USE_CASE)
    private readonly _getResourceUseCase: IGetResourceUseCase,
    @Inject(LIST_RESOURCES_USE_CASE)
    private readonly _listResourcesUseCase: IListResourcesUseCase,
    @Inject(UPDATE_RESOURCE_USE_CASE)
    private readonly _updateResourceUseCase: IUpdateResourceUseCase,
    @Inject(DELETE_RESOURCE_USE_CASE)
    private readonly _deleteResourceUseCase: IDeleteResourceUseCase,
    @Inject(BATCH_SYNC_INVENTORY_USE_CASE)
    private readonly _batchSyncInventoryUseCase: IBatchSyncInventoryUseCase,
    @Inject(CREATE_BOOKING_USE_CASE)
    private readonly _createBookingUseCase: ICreateBookingUseCase,
    @Inject(CANCEL_BOOKING_USE_CASE)
    private readonly _cancelBookingUseCase: ICancelBookingUseCase,
    @Inject(RESCHEDULE_BOOKING_USE_CASE)
    private readonly _rescheduleBookingUseCase: IRescheduleBookingUseCase,
    @Inject(GET_AVAILABILITY_USE_CASE)
    private readonly _getAvailabilityUseCase: IGetAvailabilityUseCase,
    @Inject(LIST_BOOKINGS_USE_CASE)
    private readonly _listBookingsUseCase: IListBookingsUseCase,
  ) {}

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.CREATE_SERVICE)
  async createService(request: CreateServiceRequest): Promise<ServiceResponse> {
    const service = await this._createServiceUseCase.execute(request);
    return {
      service: ServiceMapper.toProto(service),
      message: RESPONSE_MESSAGES.SERVICE.CREATED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.GET_SERVICE)
  async getService(request: GetServiceRequest): Promise<ServiceResponse> {
    const service = await this._getServiceUseCase.execute(request);
    return {
      service: ServiceMapper.toProto(service),
      message: RESPONSE_MESSAGES.SERVICE.RETRIEVED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.LIST_SERVICES)
  async listServices(request: ListServicesRequest): Promise<ListServicesResponse> {
    const result = await this._listServicesUseCase.execute(request);
    return {
      services: result.services.map((s) => ServiceMapper.toProto(s)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      summary: result.summary
        ? {
            total_count: result.summary.totalCount,
            avg_price: result.summary.avgPrice,
            deposit_count: result.summary.depositCount,
            categories: result.summary.categories,
          }
        : undefined,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.UPDATE_SERVICE)
  async updateService(request: UpdateServiceRequest): Promise<ServiceResponse> {
    const service = await this._updateServiceUseCase.execute(request);
    return {
      service: ServiceMapper.toProto(service),
      message: RESPONSE_MESSAGES.SERVICE.UPDATED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.DELETE_SERVICE)
  async deleteService(request: DeleteServiceRequest): Promise<DeleteServiceResponse> {
    const success = await this._deleteServiceUseCase.execute(request);
    return {
      success,
      message: RESPONSE_MESSAGES.SERVICE.DELETED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.CREATE_RESOURCE)
  async createResource(request: CreateResourceRequest): Promise<ResourceResponse> {
    const resource = await this._createResourceUseCase.execute(request);
    return {
      resource: ResourceMapper.toProto(resource),
      message: RESPONSE_MESSAGES.RESOURCE.CREATED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.GET_RESOURCE)
  async getResource(request: GetResourceRequest): Promise<ResourceResponse> {
    const resource = await this._getResourceUseCase.execute(request);
    return {
      resource: ResourceMapper.toProto(resource),
      message: RESPONSE_MESSAGES.RESOURCE.RETRIEVED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.LIST_RESOURCES)
  async listResources(request: ListResourcesRequest): Promise<ListResourcesResponse> {
    const result = await this._listResourcesUseCase.execute(request);
    return {
      resources: result.resources.map((r) => ResourceMapper.toProto(r)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      summary: result.summary
        ? {
            total_count: result.summary.totalCount,
            active_count: result.summary.activeCount,
            staff_count: result.summary.staffCount,
            physical_count: result.summary.physicalCount,
          }
        : undefined,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.UPDATE_RESOURCE)
  async updateResource(request: UpdateResourceRequest): Promise<ResourceResponse> {
    const resource = await this._updateResourceUseCase.execute(request);
    return {
      resource: ResourceMapper.toProto(resource),
      message: RESPONSE_MESSAGES.RESOURCE.UPDATED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.DELETE_RESOURCE)
  async deleteResource(request: DeleteResourceRequest): Promise<DeleteResourceResponse> {
    const success = await this._deleteResourceUseCase.execute(request);
    return {
      success,
      message: RESPONSE_MESSAGES.RESOURCE.DELETED,
    };
  }

  @GrpcMethod(
    GRPC_SERVICES.SCHEDULING_INVENTORY,
    GRPC_METHODS.SCHEDULING_INVENTORY.BATCH_SYNC_INVENTORY,
  )
  async batchSyncInventory(
    request: BatchSyncInventoryRequest,
  ): Promise<BatchSyncInventoryResponse> {
    return this._batchSyncInventoryUseCase.execute(request);
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.CREATE_BOOKING)
  async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
    const booking = await this._createBookingUseCase.execute(request);
    return {
      booking: BookingMapper.toProto(booking),
      message: RESPONSE_MESSAGES.BOOKING.CREATED,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.CANCEL_BOOKING)
  async cancelBooking(request: CancelBookingRequest): Promise<BookingResponse> {
    const booking = await this._cancelBookingUseCase.execute(request);
    return {
      booking: BookingMapper.toProto(booking),
      message: RESPONSE_MESSAGES.BOOKING.CANCELLED,
    };
  }

  @GrpcMethod(
    GRPC_SERVICES.SCHEDULING_INVENTORY,
    GRPC_METHODS.SCHEDULING_INVENTORY.RESCHEDULE_BOOKING,
  )
  async rescheduleBooking(request: RescheduleBookingRequest): Promise<BookingResponse> {
    const booking = await this._rescheduleBookingUseCase.execute(request);
    return {
      booking: BookingMapper.toProto(booking),
      message: RESPONSE_MESSAGES.BOOKING.RESCHEDULED,
    };
  }

  @GrpcMethod(
    GRPC_SERVICES.SCHEDULING_INVENTORY,
    GRPC_METHODS.SCHEDULING_INVENTORY.GET_AVAILABILITY,
  )
  async getAvailability(request: GetAvailabilityRequest): Promise<GetAvailabilityResponse> {
    return this._getAvailabilityUseCase.execute(request);
  }

  @GrpcMethod(GRPC_SERVICES.SCHEDULING_INVENTORY, GRPC_METHODS.SCHEDULING_INVENTORY.LIST_BOOKINGS)
  async listBookings(request: ListBookingsRequest): Promise<ListBookingsResponse> {
    const result = await this._listBookingsUseCase.execute(request);
    return {
      bookings: result.bookings.map((b) => BookingMapper.toProto(b)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
