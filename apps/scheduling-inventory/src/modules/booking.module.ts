import { Module } from '@nestjs/common';
import {
  CREATE_BOOKING_USE_CASE,
  GET_AVAILABILITY_USE_CASE,
} from '../application/interfaces/booking-use-cases.interface.js';
import { CreateBookingUseCase } from '../application/use-cases/booking/create-booking.use-case.js';
import { GetAvailabilityUseCase } from '../application/use-cases/booking/get-availability.use-case.js';
import {
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
      provide: GET_AVAILABILITY_USE_CASE,
      useClass: GetAvailabilityUseCase,
    },
  ],
  exports: [
    BOOKING_REPOSITORY,
    CUSTOMER_REPOSITORY,
    CREATE_BOOKING_USE_CASE,
    GET_AVAILABILITY_USE_CASE,
  ],
})
export class BookingModule {}
