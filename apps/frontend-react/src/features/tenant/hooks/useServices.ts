import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  servicesApi,
  type ListServicesParams,
  type ListServicesResponseData,
  type CreateServicePayload,
  type UpdateServicePayload,
  type ListResourcesParams,
  type ListResourcesResponseData,
  type CreateResourcePayload,
} from '../api/servicesApi';
import type { ApiResponse } from '../../../api/axiosClient';
import type { ServiceInfo, ResourceInfo } from '@repo/proto/scheduling';

export const SCHEDULING_KEYS = {
  allServices: ['scheduling-services'] as const,
  servicesList: (params?: ListServicesParams) => ['scheduling-services', params] as const,
  serviceDetail: (id: string) => ['scheduling-service', id] as const,
  allResources: ['scheduling-resources'] as const,
  resourcesList: (params?: ListResourcesParams) => ['scheduling-resources', params] as const,
};

export function useServicesList(params?: ListServicesParams) {
  return useQuery<ListServicesResponseData, Error>({
    queryKey: SCHEDULING_KEYS.servicesList(params),
    queryFn: () => servicesApi.listServices(params),
    staleTime: 30 * 1000,
  });
}

export function useService(serviceId?: string) {
  return useQuery<ApiResponse<ServiceInfo>, Error>({
    queryKey: SCHEDULING_KEYS.serviceDetail(serviceId || ''),
    queryFn: () => servicesApi.getService(serviceId!),
    enabled: Boolean(serviceId),
    staleTime: 30 * 1000,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ServiceInfo>, Error, CreateServicePayload>({
    mutationFn: (payload) => servicesApi.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULING_KEYS.allServices });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<ServiceInfo>,
    Error,
    { serviceId: string; payload: UpdateServicePayload }
  >({
    mutationFn: ({ serviceId, payload }) => servicesApi.updateService(serviceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULING_KEYS.allServices });
      queryClient.invalidateQueries({
        queryKey: SCHEDULING_KEYS.serviceDetail(variables.serviceId),
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ success: boolean }>, Error, string>({
    mutationFn: (serviceId) => servicesApi.deleteService(serviceId),
    onSuccess: (_, serviceId) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULING_KEYS.allServices });
      queryClient.removeQueries({
        queryKey: SCHEDULING_KEYS.serviceDetail(serviceId),
      });
    },
  });
}

export function useResourcesList(params?: ListResourcesParams) {
  return useQuery<ListResourcesResponseData, Error>({
    queryKey: SCHEDULING_KEYS.resourcesList(params),
    queryFn: () => servicesApi.listResources(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ResourceInfo>, Error, CreateResourcePayload>({
    mutationFn: (payload) => servicesApi.createResource(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULING_KEYS.allResources });
    },
  });
}
