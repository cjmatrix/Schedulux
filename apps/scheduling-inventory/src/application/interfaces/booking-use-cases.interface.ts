import {
  CancelBookingRequest,
  CreateBookingRequest,
  GetAvailabilityRequest,
  GetAvailabilityResponse,
  ListBookingsRequest,
  ListCustomersRequest,
  ListCustomersResponse,
  RescheduleBookingRequest,
  VerifyCustomerRequest,
  VerifyCustomerResponse,
} from '@repo/proto/scheduling';
import { BookingEntity } from '../../domain/entities/booking.entity.js';

export const CREATE_BOOKING_USE_CASE = 'ICreateBookingUseCase';
export const CANCEL_BOOKING_USE_CASE = 'ICancelBookingUseCase';
export const RESCHEDULE_BOOKING_USE_CASE = 'IRescheduleBookingUseCase';
export const GET_AVAILABILITY_USE_CASE = 'IGetAvailabilityUseCase';
export const LIST_BOOKINGS_USE_CASE = 'IListBookingsUseCase';
export const VERIFY_CUSTOMER_USE_CASE = 'IVerifyCustomerUseCase';
export const LIST_CUSTOMERS_USE_CASE = 'IListCustomersUseCase';

export interface ICreateBookingUseCase {
  execute(dto: CreateBookingRequest): Promise<BookingEntity>;
}

export interface ICancelBookingUseCase {
  execute(dto: CancelBookingRequest): Promise<BookingEntity>;
}

export interface IRescheduleBookingUseCase {
  execute(dto: RescheduleBookingRequest): Promise<BookingEntity>;
}

export interface IGetAvailabilityUseCase {
  execute(dto: GetAvailabilityRequest): Promise<GetAvailabilityResponse>;
}

export interface IListBookingsUseCase {
  execute(dto: ListBookingsRequest): Promise<{
    bookings: BookingEntity[];
    total: number;
    page: number;
    limit: number;
  }>;
}

export interface IVerifyCustomerUseCase {
  execute(dto: VerifyCustomerRequest): Promise<VerifyCustomerResponse>;
}

export interface IListCustomersUseCase {
  execute(dto: ListCustomersRequest): Promise<ListCustomersResponse>;
}
