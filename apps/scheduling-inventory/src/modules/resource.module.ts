import { Module } from '@nestjs/common';
import {
  CREATE_RESOURCE_USE_CASE,
  DELETE_RESOURCE_USE_CASE,
  GET_RESOURCE_USE_CASE,
  LIST_RESOURCES_USE_CASE,
  UPDATE_RESOURCE_USE_CASE,
} from '../application/interfaces/resource-use-cases.interface.js';
import { CreateResourceUseCase } from '../application/use-cases/resource/create-resource.use-case.js';
import { DeleteResourceUseCase } from '../application/use-cases/resource/delete-resource.use-case.js';
import { GetResourceUseCase } from '../application/use-cases/resource/get-resource.use-case.js';
import { ListResourcesUseCase } from '../application/use-cases/resource/list-resources.use-case.js';
import { UpdateResourceUseCase } from '../application/use-cases/resource/update-resource.use-case.js';
import { RESOURCE_REPOSITORY } from '../domain/tokens.js';
import { MongoResourceRepository } from '../infrastructure/database/repositories/mongo-resource.repository.js';

@Module({
  providers: [
    {
      provide: RESOURCE_REPOSITORY,
      useClass: MongoResourceRepository,
    },
    {
      provide: CREATE_RESOURCE_USE_CASE,
      useClass: CreateResourceUseCase,
    },
    {
      provide: GET_RESOURCE_USE_CASE,
      useClass: GetResourceUseCase,
    },
    {
      provide: LIST_RESOURCES_USE_CASE,
      useClass: ListResourcesUseCase,
    },
    {
      provide: UPDATE_RESOURCE_USE_CASE,
      useClass: UpdateResourceUseCase,
    },
    {
      provide: DELETE_RESOURCE_USE_CASE,
      useClass: DeleteResourceUseCase,
    },
  ],
  exports: [
    RESOURCE_REPOSITORY,
    CREATE_RESOURCE_USE_CASE,
    GET_RESOURCE_USE_CASE,
    LIST_RESOURCES_USE_CASE,
    UPDATE_RESOURCE_USE_CASE,
    DELETE_RESOURCE_USE_CASE,
  ],
})
export class ResourceModule {}
