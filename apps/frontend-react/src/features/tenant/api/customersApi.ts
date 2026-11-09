import { axiosClient } from '../../../api/axiosClient';

export interface CustomerItem {
  id: string;
  tenant_id: string;
  agent_id?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  is_guest: boolean;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  agent_id?: string;
}

export interface ListCustomersResponseData {
  message: string;
  data: CustomerItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export const customersApi = {
  listCustomers: async (params?: ListCustomersParams): Promise<ListCustomersResponseData> => {
    const response = await axiosClient.get<ListCustomersResponseData>(
      '/api/v1/tenant/scheduling/customers',
      { params },
    );
    return response.data;
  },
};
