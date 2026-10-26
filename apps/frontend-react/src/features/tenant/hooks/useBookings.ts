import type { BookingInfo, GetAvailabilityResponse } from '@repo/proto/scheduling';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  bookingsApi,
  type CreateBookingPayload,
  type GetAvailabilityParams,
} from '../api/bookingsApi';

export const BOOKING_KEYS = {
  allBookings: ['scheduling-bookings'] as const,
  bookingsList: (params?: Record<string, unknown>) => ['scheduling-bookings', params] as const,
  availability: (params?: GetAvailabilityParams) => ['scheduling-availability', params] as const,
};

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
