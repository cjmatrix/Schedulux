import { BatchSyncInventoryRequest, BatchSyncInventoryResponse } from '@repo/proto/scheduling';

export const BATCH_SYNC_INVENTORY_USE_CASE = 'IBatchSyncInventoryUseCase';

export interface IBatchSyncInventoryUseCase {
  execute(dto: BatchSyncInventoryRequest): Promise<BatchSyncInventoryResponse>;
}
