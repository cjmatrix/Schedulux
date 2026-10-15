import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateServiceRequest,
  GetServiceRequest,
  ListServicesRequest,
  UpdateServiceRequest,
  DeleteServiceRequest,
  ServiceResponse,
  ListServicesResponse,
  DeleteServiceResponse,
  CreateResourceRequest,
  GetResourceRequest,
  ListResourcesRequest,
  UpdateResourceRequest,
  DeleteResourceRequest,
  ResourceResponse,
  ListResourcesResponse,
  DeleteResourceResponse,
  BatchSyncInventoryRequest,
  BatchSyncInventoryResponse,
  SCHEDULING_INVENTORY_SERVICE_NAME,
} from '@repo/proto/scheduling';
import {
  IBatchSyncInventoryUseCase,
  BATCH_SYNC_INVENTORY_USE_CASE,
} from '../../application/interfaces/batch-sync-use-case.interface.js';
import {
  ICreateServiceUseCase,
  IGetServiceUseCase,
  IListServicesUseCase,
  IUpdateServiceUseCase,
  IDeleteServiceUseCase,
  CREATE_SERVICE_USE_CASE,
  GET_SERVICE_USE_CASE,
  LIST_SERVICES_USE_CASE,
  UPDATE_SERVICE_USE_CASE,
  DELETE_SERVICE_USE_CASE,
} from '../../application/interfaces/service-use-cases.interface.js';
import {
  ICreateResourceUseCase,
  IGetResourceUseCase,
  IListResourcesUseCase,
  IUpdateResourceUseCase,
  IDeleteResourceUseCase,
  CREATE_RESOURCE_USE_CASE,
  GET_RESOURCE_USE_CASE,
  LIST_RESOURCES_USE_CASE,
  UPDATE_RESOURCE_USE_CASE,
  DELETE_RESOURCE_USE_CASE,
} from '../../application/interfaces/resource-use-cases.interface.js';
import { ServiceMapper } from '../../infrastructure/database/mappers/service.mapper.js';
import { ResourceMapper } from '../../infrastructure/database/mappers/resource.mapper.js';

@Controller()
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
  async batchSyncInventory(request: BatchSyncInventoryRequest): Promise<BatchSyncInventoryResponse> {
    return this.batchSyncInventoryUseCase.execute(request);
  }
}
