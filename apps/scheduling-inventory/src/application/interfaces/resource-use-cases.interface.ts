import {
  CreateResourceRequest,
  DeleteResourceRequest,
  GetResourceRequest,
  ListResourcesRequest,
  UpdateResourceRequest,
} from '@repo/proto/scheduling';
import { ResourceEntity } from '../../domain/entities/resource.entity.js';
import { ResourceSummary } from '../../domain/repositories/resource.repository.interface.js';
import { IUseCase } from './use-case.interface.js';

export interface ListResourcesOutput {
  resources: ResourceEntity[];
  total: number;
  page: number;
  limit: number;
  summary?: ResourceSummary;
}

export interface ICreateResourceUseCase extends IUseCase<CreateResourceRequest, ResourceEntity> {}
export interface IGetResourceUseCase extends IUseCase<GetResourceRequest, ResourceEntity> {}
export interface IListResourcesUseCase
  extends IUseCase<ListResourcesRequest, ListResourcesOutput> {}
export interface IUpdateResourceUseCase extends IUseCase<UpdateResourceRequest, ResourceEntity> {}
export interface IDeleteResourceUseCase extends IUseCase<DeleteResourceRequest, boolean> {}

export const CREATE_RESOURCE_USE_CASE = 'ICreateResourceUseCase';
export const GET_RESOURCE_USE_CASE = 'IGetResourceUseCase';
export const LIST_RESOURCES_USE_CASE = 'IListResourcesUseCase';
export const UPDATE_RESOURCE_USE_CASE = 'IUpdateResourceUseCase';
export const DELETE_RESOURCE_USE_CASE = 'IDeleteResourceUseCase';
