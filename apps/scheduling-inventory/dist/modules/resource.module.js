var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../domain/tokens.js';
import { MongoResourceRepository } from '../infrastructure/database/repositories/mongo-resource.repository.js';
import { CREATE_RESOURCE_USE_CASE, GET_RESOURCE_USE_CASE, LIST_RESOURCES_USE_CASE, UPDATE_RESOURCE_USE_CASE, DELETE_RESOURCE_USE_CASE, } from '../application/interfaces/resource-use-cases.interface.js';
import { CreateResourceUseCase } from '../application/use-cases/resource/create-resource.use-case.js';
import { GetResourceUseCase } from '../application/use-cases/resource/get-resource.use-case.js';
import { ListResourcesUseCase } from '../application/use-cases/resource/list-resources.use-case.js';
import { UpdateResourceUseCase } from '../application/use-cases/resource/update-resource.use-case.js';
import { DeleteResourceUseCase } from '../application/use-cases/resource/delete-resource.use-case.js';
let ResourceModule = class ResourceModule {
};
ResourceModule = __decorate([
    Module({
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
], ResourceModule);
export { ResourceModule };
