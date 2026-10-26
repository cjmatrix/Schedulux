import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcExceptionFilter } from './grpc-exception.filter.js';
import {
  BatchSyncInventoryRequest,
  BatchSyncInventoryResponse,
  BookingResponse,
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
  ListResourcesRequest,
  ListResourcesResponse,
  ListServicesRequest,
  ListServicesResponse,
  ResourceResponse,
  SCHEDULING_INVENTORY_SERVICE_NAME,
  ServiceResponse,
  UpdateResourceRequest,
  UpdateServiceRequest,
} from '@repo/proto/scheduling';
import {
  BATCH_SYNC_INVENTORY_USE_CASE,
  IBatchSyncInventoryUseCase,
} from '../../application/interfaces/batch-sync-use-case.interface.js';
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
import {
  CREATE_BOOKING_USE_CASE,
  GET_AVAILABILITY_USE_CASE,
  ICreateBookingUseCase,
  IGetAvailabilityUseCase,
} from '../../application/interfaces/booking-use-cases.interface.js';
import { BookingMapper } from '../../infrastructure/database/mappers/booking.mapper.js';
import { ResourceMapper } from '../../infrastructure/database/mappers/resource.mapper.js';
import { ServiceMapper } from '../../infrastructure/database/mappers/service.mapper.js';

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class SchedulingInventoryGrpcController {
  constructor(
    @Inject(CREATE_SERVICE_USE_CASE)
    private readonly createServiceUseCase: ICreateServiceUseCase,
    @Inject(GET_SERVICE_USE_CASE)
    private readonly getServiceUseCase: IGetServiceUseCase,
    @Inject(LIST_SERVICES_USE_CASE)
    private readonly listServicesUseCase: IListServicesUseCase,
    @Inject(UPDATE_SERVICE_USE_CASE)
    private readonly updateServiceUseCase: IUpdateServiceUseCase,
    @Inject(DELETE_SERVICE_USE_CASE)
    private readonly deleteServiceUseCase: IDeleteServiceUseCase,
    @Inject(CREATE_RESOURCE_USE_CASE)
    private readonly createResourceUseCase: ICreateResourceUseCase,
    @Inject(GET_RESOURCE_USE_CASE)
    private readonly getResourceUseCase: IGetResourceUseCase,
    @Inject(LIST_RESOURCES_USE_CASE)
    private readonly listResourcesUseCase: IListResourcesUseCase,
    @Inject(UPDATE_RESOURCE_USE_CASE)
    private readonly updateResourceUseCase: IUpdateResourceUseCase,
    @Inject(DELETE_RESOURCE_USE_CASE)
    private readonly deleteResourceUseCase: IDeleteResourceUseCase,
    @Inject(BATCH_SYNC_INVENTORY_USE_CASE)
    private readonly batchSyncInventoryUseCase: IBatchSyncInventoryUseCase,
    @Inject(CREATE_BOOKING_USE_CASE)
    private readonly createBookingUseCase: ICreateBookingUseCase,
    @Inject(GET_AVAILABILITY_USE_CASE)
    private readonly getAvailabilityUseCase: IGetAvailabilityUseCase,
  ) {}

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'CreateService')
  async createService(request: CreateServiceRequest): Promise<ServiceResponse> {
    const service = await this.createServiceUseCase.execute(request);
    return {
      service: ServiceMapper.toProto(service),
      message: 'Service created successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'GetService')
  async getService(request: GetServiceRequest): Promise<ServiceResponse> {
    const service = await this.getServiceUseCase.execute(request);
    return {
      service: ServiceMapper.toProto(service),
      message: 'Service retrieved successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'ListServices')
  async listServices(request: ListServicesRequest): Promise<ListServicesResponse> {
    const result = await this.listServicesUseCase.execute(request);
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

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'UpdateService')
  async updateService(request: UpdateServiceRequest): Promise<ServiceResponse> {
    const service = await this.updateServiceUseCase.execute(request);
    return {
      service: ServiceMapper.toProto(service),
      message: 'Service updated successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'DeleteService')
  async deleteService(request: DeleteServiceRequest): Promise<DeleteServiceResponse> {
    const success = await this.deleteServiceUseCase.execute(request);
    return {
      success,
      message: 'Service deleted successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'CreateResource')
  async createResource(request: CreateResourceRequest): Promise<ResourceResponse> {
    const resource = await this.createResourceUseCase.execute(request);
    return {
      resource: ResourceMapper.toProto(resource),
      message: 'Resource created successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'GetResource')
  async getResource(request: GetResourceRequest): Promise<ResourceResponse> {
    const resource = await this.getResourceUseCase.execute(request);
    return {
      resource: ResourceMapper.toProto(resource),
      message: 'Resource retrieved successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'ListResources')
  async listResources(request: ListResourcesRequest): Promise<ListResourcesResponse> {
    const result = await this.listResourcesUseCase.execute(request);
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

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'UpdateResource')
  async updateResource(request: UpdateResourceRequest): Promise<ResourceResponse> {
    const resource = await this.updateResourceUseCase.execute(request);
    return {
      resource: ResourceMapper.toProto(resource),
      message: 'Resource updated successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'DeleteResource')
  async deleteResource(request: DeleteResourceRequest): Promise<DeleteResourceResponse> {
    const success = await this.deleteResourceUseCase.execute(request);
    return {
      success,
      message: 'Resource deleted successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'BatchSyncInventory')
  async batchSyncInventory(
    request: BatchSyncInventoryRequest,
  ): Promise<BatchSyncInventoryResponse> {
    return this.batchSyncInventoryUseCase.execute(request);
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'CreateBooking')
  async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
    const booking = await this.createBookingUseCase.execute(request);
    return {
      booking: BookingMapper.toProto(booking),
      message: 'Booking created successfully',
    };
  }

  @GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'GetAvailability')
  async getAvailability(request: GetAvailabilityRequest): Promise<GetAvailabilityResponse> {
    return this.getAvailabilityUseCase.execute(request);
  }
}

