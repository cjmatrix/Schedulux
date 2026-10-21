import type { ResourceInfo } from '@repo/proto/scheduling';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  type CreateResourcePayload,
  type ListResourcesParams,
  type ListResourcesResponseData,
  resourcesApi,
  type UpdateResourcePayload,
} from '../api/resourcesApi';

export const RESOURCE_KEYS = {
  all: ['scheduling-resources'] as const,
  list: (params?: ListResourcesParams) => ['scheduling-resources', params] as const,
  detail: (id: string) => ['scheduling-resource', id] as const,
};

export function useResourcesList(params?: ListResourcesParams) {
  return useQuery<ListResourcesResponseData, Error>({
    queryKey: RESOURCE_KEYS.list(params),
    queryFn: () => resourcesApi.listResources(params),
    staleTime: 30 * 1000,
  });
}

export function useResource(resourceId?: string) {
  return useQuery<ApiResponse<ResourceInfo>, Error>({
    queryKey: RESOURCE_KEYS.detail(resourceId || ''),
    queryFn: () => resourcesApi.getResource(resourceId!),
    enabled: Boolean(resourceId),
    staleTime: 30 * 1000,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ResourceInfo>, Error, CreateResourcePayload>({
    mutationFn: (payload) => resourcesApi.createResource(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<ResourceInfo>,
    Error,
    { resourceId: string; payload: UpdateResourcePayload }
  >({
    mutationFn: ({ resourceId, payload }) => resourcesApi.updateResource(resourceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: RESOURCE_KEYS.detail(variables.resourceId),
      });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ success: boolean }>, Error, string>({
    mutationFn: (resourceId) => resourcesApi.deleteResource(resourceId),
    onSuccess: (_, resourceId) => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all });
      queryClient.removeQueries({
        queryKey: RESOURCE_KEYS.detail(resourceId),
      });
    },
  });
}
