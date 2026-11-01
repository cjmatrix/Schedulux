import { Module } from '@nestjs/common';
import {
  CANCEL_BOOKING_USE_CASE,
  CREATE_BOOKING_USE_CASE,
  GET_AVAILABILITY_USE_CASE,
  LIST_BOOKINGS_USE_CASE,
  RESCHEDULE_BOOKING_USE_CASE,
} from '../application/interfaces/booking-use-cases.interface.js';
import { BookingAllocationService } from '../application/services/booking-allocation.service.js';
import { CancelBookingUseCase } from '../application/use-cases/booking/cancel-booking.use-case.js';
import { CreateBookingUseCase } from '../application/use-cases/booking/create-booking.use-case.js';
import { GetAvailabilityUseCase } from '../application/use-cases/booking/get-availability.use-case.js';
import { ListBookingsUseCase } from '../application/use-cases/booking/list-bookings.use-case.js';
import { RescheduleBookingUseCase } from '../application/use-cases/booking/reschedule-booking.use-case.js';
import {
  BOOKING_ALLOCATION_SERVICE,
  BOOKING_REPOSITORY,
  CUSTOMER_REPOSITORY,
} from '../domain/tokens.js';
import { MongoBookingRepository } from '../infrastructure/database/repositories/mongo-booking.repository.js';
import { MongoCustomerRepository } from '../infrastructure/database/repositories/mongo-customer.repository.js';
import { ResourceModule } from './resource.module.js';
import { ScheduleModule } from './schedule.module.js';
import { ServiceModule } from './service.module.js';

@Module({
  imports: [ServiceModule, ResourceModule, ScheduleModule],
  providers: [
    BookingAllocationService,
    {
      provide: BOOKING_ALLOCATION_SERVICE,
      useClass: BookingAllocationService,
    },
    {
      provide: BOOKING_REPOSITORY,
      useClass: MongoBookingRepository,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: MongoCustomerRepository,
    },
    {
      provide: CREATE_BOOKING_USE_CASE,
      useClass: CreateBookingUseCase,
    },
    {
      provide: CANCEL_BOOKING_USE_CASE,
      useClass: CancelBookingUseCase,
    },
    {
      provide: RESCHEDULE_BOOKING_USE_CASE,
      useClass: RescheduleBookingUseCase,
    },
    {
      provide: GET_AVAILABILITY_USE_CASE,
      useClass: GetAvailabilityUseCase,
    },
    {
      provide: LIST_BOOKINGS_USE_CASE,
      useClass: ListBookingsUseCase,
    },
  ],
  exports: [
    BookingAllocationService,
    BOOKING_ALLOCATION_SERVICE,
    BOOKING_REPOSITORY,
    CUSTOMER_REPOSITORY,
    CREATE_BOOKING_USE_CASE,
    CANCEL_BOOKING_USE_CASE,
    RESCHEDULE_BOOKING_USE_CASE,
    GET_AVAILABILITY_USE_CASE,
    LIST_BOOKINGS_USE_CASE,
  ],
})
export class BookingModule {}
