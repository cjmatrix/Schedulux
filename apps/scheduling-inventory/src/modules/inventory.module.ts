import { Module } from '@nestjs/common';
import { BATCH_SYNC_INVENTORY_USE_CASE } from '../application/interfaces/batch-sync-use-case.interface.js';
import { BatchSyncInventoryUseCase } from '../application/use-cases/inventory/batch-sync-inventory.use-case.js';
import { IResourceRepository } from '../domain/repositories/resource.repository.interface.js';
import { IServiceRepository } from '../domain/repositories/service.repository.interface.js';
import { RESOURCE_REPOSITORY, SERVICE_REPOSITORY } from '../domain/tokens.js';
import { ResourceModule } from './resource.module.js';
import { ServiceModule } from './service.module.js';

@Module({
  imports: [ResourceModule, ServiceModule],
  providers: [
    {
      provide: BATCH_SYNC_INVENTORY_USE_CASE,
      useFactory: (resourceRepo: IResourceRepository, serviceRepo: IServiceRepository) =>
        new BatchSyncInventoryUseCase(resourceRepo, serviceRepo),
      inject: [RESOURCE_REPOSITORY, SERVICE_REPOSITORY],
    },
  ],
  exports: [BATCH_SYNC_INVENTORY_USE_CASE],
})
export class InventoryModule {}
