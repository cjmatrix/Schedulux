import { Module } from '@nestjs/common';
import {
  CREATE_SERVICE_USE_CASE,
  DELETE_SERVICE_USE_CASE,
  GET_SERVICE_USE_CASE,
  LIST_SERVICES_USE_CASE,
  UPDATE_SERVICE_USE_CASE,
} from '../application/interfaces/service-use-cases.interface.js';
import { CreateServiceUseCase } from '../application/use-cases/service/create-service.use-case.js';
import { DeleteServiceUseCase } from '../application/use-cases/service/delete-service.use-case.js';
import { GetServiceUseCase } from '../application/use-cases/service/get-service.use-case.js';
import { ListServicesUseCase } from '../application/use-cases/service/list-services.use-case.js';
import { UpdateServiceUseCase } from '../application/use-cases/service/update-service.use-case.js';
import { SERVICE_REPOSITORY } from '../domain/tokens.js';
import { MongoServiceRepository } from '../infrastructure/database/repositories/mongo-service.repository.js';
import { SchedulingEventsProducer } from '../infrastructure/messaging/scheduling-events.producer.js';

@Module({
  providers: [
    {
      provide: SERVICE_REPOSITORY,
      useClass: MongoServiceRepository,
    },
    {
      provide: CREATE_SERVICE_USE_CASE,
      useFactory: (repo: MongoServiceRepository, producer: SchedulingEventsProducer) =>
        new CreateServiceUseCase(repo, producer),
      inject: [SERVICE_REPOSITORY, SchedulingEventsProducer],
    },
    {
      provide: GET_SERVICE_USE_CASE,
      useClass: GetServiceUseCase,
    },
    {
      provide: LIST_SERVICES_USE_CASE,
      useClass: ListServicesUseCase,
    },
    {
      provide: UPDATE_SERVICE_USE_CASE,
      useFactory: (repo: MongoServiceRepository, producer: SchedulingEventsProducer) =>
        new UpdateServiceUseCase(repo, producer),
      inject: [SERVICE_REPOSITORY, SchedulingEventsProducer],
    },
    {
      provide: DELETE_SERVICE_USE_CASE,
      useFactory: (repo: MongoServiceRepository, producer: SchedulingEventsProducer) =>
        new DeleteServiceUseCase(repo, producer),
      inject: [SERVICE_REPOSITORY, SchedulingEventsProducer],
    },
  ],
  exports: [
    SERVICE_REPOSITORY,
    CREATE_SERVICE_USE_CASE,
    GET_SERVICE_USE_CASE,
    LIST_SERVICES_USE_CASE,
    UPDATE_SERVICE_USE_CASE,
    DELETE_SERVICE_USE_CASE,
  ],
})
export class ServiceModule {}
