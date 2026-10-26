import {
  CreateBookingRequest,
  GetAvailabilityRequest,
  GetAvailabilityResponse,
} from '@repo/proto/scheduling';
import { BookingEntity } from '../../domain/entities/booking.entity.js';

export const CREATE_BOOKING_USE_CASE = 'ICreateBookingUseCase';
export const GET_AVAILABILITY_USE_CASE = 'IGetAvailabilityUseCase';

export interface ICreateBookingUseCase {
  execute(dto: CreateBookingRequest): Promise<BookingEntity>;
}

export interface IGetAvailabilityUseCase {
  execute(dto: GetAvailabilityRequest): Promise<GetAvailabilityResponse>;
}
