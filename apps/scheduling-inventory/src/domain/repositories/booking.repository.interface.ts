import { BookingEntity } from '../entities/booking.entity.js';

export interface FindBookingsFilter {
  page: number;
  limit: number;
  serviceId?: string;
  resourceId?: string;
  customerId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface IBookingRepository {
  create(booking: BookingEntity): Promise<BookingEntity>;
  findById(tenantId: string, bookingId: string): Promise<BookingEntity | null>;
  findByReference(tenantId: string, bookingReference: string): Promise<BookingEntity | null>;
  findOverlappingBookings(
    tenantId: string,
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<BookingEntity[]>;
  findBusyResourceIds(
    tenantId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<Set<string>>;
  findActiveBookingsInRange(
    tenantId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<ActiveBookingInterval[]>;
  findAll(
    tenantId: string,
    filter: FindBookingsFilter,
  ): Promise<{
    bookings: BookingEntity[];
    total: number;
  }>;
  update(booking: BookingEntity): Promise<BookingEntity | null>;
}

export interface ActiveBookingInterval {
  resource_id?: string | null;
  resource_ids?: string[];
  assigned_asset_ids?: string[];
  start_time: Date;
  effective_end_time: Date;
}
