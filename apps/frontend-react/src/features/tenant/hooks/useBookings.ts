import type { BookingInfo, GetAvailabilityResponse } from '@repo/proto/scheduling';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  bookingsApi,
  type CreateBookingPayload,
  type GetAvailabilityParams,
  type ListBookingsParams,
  type ListBookingsResponseData,
} from '../api/bookingsApi';

export const BOOKING_KEYS = {
  allBookings: ['scheduling-bookings'] as const,
  bookingsList: (params?: ListBookingsParams) => ['scheduling-bookings', params] as const,
  availability: (params?: GetAvailabilityParams) => ['scheduling-availability', params] as const,
};

export function useBookingsList(params?: ListBookingsParams) {
  return useQuery<ListBookingsResponseData>({
    queryKey: BOOKING_KEYS.bookingsList(params),
    queryFn: () => bookingsApi.listBookings(params),
    staleTime: 1000 * 30, // 30 seconds fresh
  });
}

export function useAvailability(params?: GetAvailabilityParams, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<GetAvailabilityResponse>>({
    queryKey: BOOKING_KEYS.availability(params),
    queryFn: () => bookingsApi.getAvailability(params!),
    enabled: !!params?.service_id && !!params?.start_date && (options?.enabled ?? true),
    staleTime: 1000 * 30,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<BookingInfo>, Error, CreateBookingPayload>({
    mutationFn: (payload) => bookingsApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.allBookings });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<BookingInfo>,
    Error,
    { bookingId: string; agentId: string; reason?: string }
  >({
    mutationFn: ({ bookingId, agentId, reason }) =>
      bookingsApi.cancelBooking(bookingId, { agent_id: agentId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.allBookings });
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<BookingInfo>,
    Error,
    {
      bookingId: string;
      agentId: string;
      newStartTime: string;
      newEndTime?: string;
      resourceId?: string;
      resourceIds?: string[];
      notes?: string;
    }
  >({
    mutationFn: ({
      bookingId,
      agentId,
      newStartTime,
      newEndTime,
      resourceId,
      resourceIds,
      notes,
    }) =>
      bookingsApi.rescheduleBooking(bookingId, {
        agent_id: agentId,
        new_start_time: newStartTime,
        new_end_time: newEndTime,
        resource_id: resourceId,
        resource_ids: resourceIds,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.allBookings });
    },
  });
}
