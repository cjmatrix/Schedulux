import type { ITierConfigDoc } from '../model/TierConfig.js';

export interface ITierConfigRepository {
  findAll(): Promise<ITierConfigDoc[]>;
  findByTier(tier: string): Promise<ITierConfigDoc | null>;
  updateByTier(tier: string, data: Partial<ITierConfigDoc>): Promise<ITierConfigDoc | null>;
  bulkUpsert(configs: Partial<ITierConfigDoc>[]): Promise<void>;
}

