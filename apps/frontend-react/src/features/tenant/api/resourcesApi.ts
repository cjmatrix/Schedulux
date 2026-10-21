import type { ResourceInfo } from '@repo/proto/scheduling';
import { type ApiResponse, axiosClient } from '../../../api/axiosClient';

export type { ResourceInfo };

export interface ListResourcesParams {
  page?: number;
  limit?: number;
  resource_type?: string;
  dispatch_status?: string;
  category?: string;
  agent_id?: string;
  search?: string;
}

export interface ResourceSummaryData {
  total_count: number;
  active_count: number;
  staff_count: number;
  physical_count: number;
}

export interface ListResourcesResponseData {
  message: string;
  data: ResourceInfo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  summary?: ResourceSummaryData;
}

export interface ShiftSlot {
  start: string; // "08:00"
  end: string; // "17:00"
}

export interface DaySchedule {
  enabled: boolean;
  shifts: ShiftSlot[];
  reason?: string;
}

export type WeeklySchedule = Record<string, DaySchedule>;

export interface CreateResourcePayload {
  agent_id?: string;
  resource_type: 'staff' | 'room' | 'chair' | 'bay' | 'equipment' | 'asset' | 'vehicle';
  name: string;
  title?: string;
  category?: string;
  description?: string;
  is_bookable?: boolean;
  dispatch_status?: 'active' | 'on_leave' | 'maintenance' | 'retired' | 'inactive';
  custom_shift_overrides_json?: string;
}

export interface UpdateResourcePayload extends Partial<CreateResourcePayload> {
  agent_id?: string;
}

export const resourcesApi = {
  listResources: async (params?: ListResourcesParams): Promise<ListResourcesResponseData> => {
    const { data } = await axiosClient.get<ListResourcesResponseData>(
      '/api/v1/tenant/scheduling/resources',
      { params },
    );
    return data;
  },

  getResource: async (resourceId: string): Promise<ApiResponse<ResourceInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<ResourceInfo>>(
      `/api/v1/tenant/scheduling/resources/${resourceId}`,
    );
    return data;
  },

  createResource: async (payload: CreateResourcePayload): Promise<ApiResponse<ResourceInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<ResourceInfo>>(
      '/api/v1/tenant/scheduling/resources',
      payload,
    );
    return data;
  },

  updateResource: async (
    resourceId: string,
    payload: UpdateResourcePayload,
  ): Promise<ApiResponse<ResourceInfo>> => {
    const { data } = await axiosClient.put<ApiResponse<ResourceInfo>>(
      `/api/v1/tenant/scheduling/resources/${resourceId}`,
      payload,
    );
    return data;
  },

  deleteResource: async (resourceId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await axiosClient.delete<ApiResponse<{ success: boolean }>>(
      `/api/v1/tenant/scheduling/resources/${resourceId}`,
    );
    return data;
  },
};
