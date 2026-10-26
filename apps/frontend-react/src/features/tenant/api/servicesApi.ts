import type {
  DepositInfo,
  PriceInfo,
  ResourceInfo,
  ServiceInfo,
  ResourceRequirementInfo,
} from '@repo/proto/scheduling';
import { type ApiResponse, axiosClient } from '../../../api/axiosClient';

export type { DepositInfo, PriceInfo, ResourceInfo, ServiceInfo, ResourceRequirementInfo };

export interface ListServicesParams {
  page?: number;
  limit?: number;
  category?: string;
  agent_id?: string;
  search?: string;
}

export interface ServiceSummaryData {
  total_count: number;
  avg_price: number;
  deposit_count: number;
  categories: string[];
}

export interface ListServicesResponseData {
  message: string;
  data: ServiceInfo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  summary?: ServiceSummaryData;
}

export interface CreateServicePayload {
  agent_id: string;
  name: string;
  category?: string;
  description?: string;
  duration_minutes: number;
  buffer_minutes?: number;
  booking_mode?: 'time_slot' | 'date_range';
  price?: {
    type: 'fixed' | 'starting_at' | 'hourly' | 'free' | 'custom';
    amount: number;
    currency: string;
  };
  deposit?: {
    required: boolean;
    amount: number;
    processor?: string;
    upi_id?: string;
    qr_code_url?: string;
    confirmation_method?: string;
    payment_instructions?: string;
  };
  verification?: {
    require_otp?: boolean | null;
  };
  resource_requirements?: ResourceRequirementInfo[];
  recall_interval_days?: number;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {}

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

export const servicesApi = {
  listServices: async (params?: ListServicesParams): Promise<ListServicesResponseData> => {
    const { data } = await axiosClient.get<ListServicesResponseData>(
      '/api/v1/tenant/scheduling/services',
      {
        params,
      },
    );
    return data;
  },

  getService: async (serviceId: string): Promise<ApiResponse<ServiceInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<ServiceInfo>>(
      `/api/v1/tenant/scheduling/services/${serviceId}`,
    );
    return data;
  },

  createService: async (payload: CreateServicePayload): Promise<ApiResponse<ServiceInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<ServiceInfo>>(
      '/api/v1/tenant/scheduling/services',
      payload,
    );
    return data;
  },

  updateService: async (
    serviceId: string,
    payload: UpdateServicePayload,
  ): Promise<ApiResponse<ServiceInfo>> => {
    const { data } = await axiosClient.put<ApiResponse<ServiceInfo>>(
      `/api/v1/tenant/scheduling/services/${serviceId}`,
      payload,
    );
    return data;
  },

  deleteService: async (serviceId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await axiosClient.delete<ApiResponse<{ success: boolean }>>(
      `/api/v1/tenant/scheduling/services/${serviceId}`,
    );
    return data;
  },

  listResources: async (params?: ListResourcesParams): Promise<ListResourcesResponseData> => {
    const { data } = await axiosClient.get<ListResourcesResponseData>(
      '/api/v1/tenant/scheduling/resources',
      {
        params,
      },
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
};
