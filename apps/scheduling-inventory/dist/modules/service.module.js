var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../domain/tokens.js';
import { MongoServiceRepository } from '../infrastructure/database/repositories/mongo-service.repository.js';
import { CREATE_SERVICE_USE_CASE, GET_SERVICE_USE_CASE, LIST_SERVICES_USE_CASE, UPDATE_SERVICE_USE_CASE, DELETE_SERVICE_USE_CASE, } from '../application/interfaces/service-use-cases.interface.js';
import { CreateServiceUseCase } from '../application/use-cases/service/create-service.use-case.js';
import { GetServiceUseCase } from '../application/use-cases/service/get-service.use-case.js';
import { ListServicesUseCase } from '../application/use-cases/service/list-services.use-case.js';
import { UpdateServiceUseCase } from '../application/use-cases/service/update-service.use-case.js';
import { DeleteServiceUseCase } from '../application/use-cases/service/delete-service.use-case.js';
let ServiceModule = class ServiceModule {
};
ServiceModule = __decorate([
    Module({
        providers: [
            {
                provide: SERVICE_REPOSITORY,
                useClass: MongoServiceRepository,
            },
            {
                provide: CREATE_SERVICE_USE_CASE,
                useClass: CreateServiceUseCase,
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
                useClass: UpdateServiceUseCase,
            },
            {
                provide: DELETE_SERVICE_USE_CASE,
                useClass: DeleteServiceUseCase,
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
], ServiceModule);
export { ServiceModule };
