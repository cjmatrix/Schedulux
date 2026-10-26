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
  source?: 'manual' | 'customer_agent' | 'web_portal';
  deposit_status?: 'not_required' | 'pending' | 'verified' | 'waived';
  created_by?: string;
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
};

