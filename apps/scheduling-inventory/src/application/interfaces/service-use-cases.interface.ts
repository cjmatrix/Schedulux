import {
  CreateServiceRequest,
  DeleteServiceRequest,
  GetServiceRequest,
  ListServicesRequest,
  UpdateServiceRequest,
} from '@repo/proto/scheduling';
import { ServiceEntity } from '../../domain/entities/service.entity.js';
import { ServiceSummary } from '../../domain/repositories/service.repository.interface.js';
import { IUseCase } from './use-case.interface.js';

export interface ListServicesOutput {
  services: ServiceEntity[];
  total: number;
  page: number;
  limit: number;
  summary?: ServiceSummary;
}

export interface ICreateServiceUseCase extends IUseCase<CreateServiceRequest, ServiceEntity> {}
export interface IGetServiceUseCase extends IUseCase<GetServiceRequest, ServiceEntity> {}
export interface IListServicesUseCase extends IUseCase<ListServicesRequest, ListServicesOutput> {}
export interface IUpdateServiceUseCase extends IUseCase<UpdateServiceRequest, ServiceEntity> {}
export interface IDeleteServiceUseCase extends IUseCase<DeleteServiceRequest, boolean> {}

export const CREATE_SERVICE_USE_CASE = 'ICreateServiceUseCase';
export const GET_SERVICE_USE_CASE = 'IGetServiceUseCase';
export const LIST_SERVICES_USE_CASE = 'IListServicesUseCase';
export const UPDATE_SERVICE_USE_CASE = 'IUpdateServiceUseCase';
export const DELETE_SERVICE_USE_CASE = 'IDeleteServiceUseCase';
