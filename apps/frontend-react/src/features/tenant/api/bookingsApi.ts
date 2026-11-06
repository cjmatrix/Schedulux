import type {
  AvailableSlotInfo,
  BookingInfo,
  CustomerSnapshotInfo,
  DayAvailabilityInfo,
  GetAvailabilityResponse,
  ResourceAvailabilityInfo,
} from '@repo/proto/scheduling';
import { type ApiResponse, axiosClient } from '../../../api/axiosClient';

export type {
  AvailableSlotInfo,
  BookingInfo,
  CustomerSnapshotInfo,
  DayAvailabilityInfo,
  GetAvailabilityResponse,
  ResourceAvailabilityInfo,
};

export interface CreateBookingPayload {
  agent_id?: string;
  service_id: string;
  resource_id?: string;
  resource_ids?: string[];
  start_time: string;
  end_time?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  source?: 'manual' | 'customer_agent' | 'web_portal' | 'sandbox_simulation';
  deposit_status?: 'not_required' | 'pending' | 'verified' | 'waived';
  created_by?: string;
}

export interface ListBookingsParams {
  page?: number;
  limit?: number;
  agent_id?: string;
  service_id?: string;
  resource_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface ListBookingsResponseData {
  message: string;
  data: BookingInfo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface GetAvailabilityParams {
  service_id: string;
  start_date: string;
  end_date?: string;
  agent_id?: string;
  resource_id?: string;
  resource_ids?: string[];
  timezone?: string;
}

export const bookingsApi = {
  listBookings: async (params?: ListBookingsParams): Promise<ListBookingsResponseData> => {
    const { data } = await axiosClient.get<ListBookingsResponseData>(
      '/api/v1/tenant/scheduling/bookings',
      { params },
    );
    return data;
  },

  createBooking: async (payload: CreateBookingPayload): Promise<ApiResponse<BookingInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<BookingInfo>>(
      '/api/v1/tenant/scheduling/bookings',
      payload,
    );
    return data;
  },

  getAvailability: async (
    params: GetAvailabilityParams,
  ): Promise<ApiResponse<GetAvailabilityResponse>> => {
    const { data } = await axiosClient.get<ApiResponse<GetAvailabilityResponse>>(
      '/api/v1/tenant/scheduling/availability',
      { params },
    );
    return data;
  },

  cancelBooking: async (
    bookingId: string,
    payload: { agent_id: string; reason?: string },
  ): Promise<ApiResponse<BookingInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<BookingInfo>>(
      `/api/v1/tenant/scheduling/bookings/${bookingId}/cancel`,
      payload,
    );
    return data;
  },

  rescheduleBooking: async (
    bookingId: string,
    payload: {
      agent_id: string;
      new_start_time: string;
      new_end_time?: string;
      resource_id?: string;
      resource_ids?: string[];
      notes?: string;
    },
  ): Promise<ApiResponse<BookingInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<BookingInfo>>(
      `/api/v1/tenant/scheduling/bookings/${bookingId}/reschedule`,
      payload,
    );
    return data;
  },
};
