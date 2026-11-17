import { Inject, Injectable, Optional } from '@nestjs/common';
import type { ITierConfigRepository } from '../interfaces/ITierConfigRepository.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import { ITierConfigDoc, TierConfigModel } from '../model/TierConfig.js';
import { BaseRepository } from './BaseRepository.js';

@Injectable()
export class TierConfigRepository extends BaseRepository<ITierConfigDoc> implements ITierConfigRepository {
  constructor(@Optional() @Inject('IUnitOfWork') unitOfWork?: IUnitOfWork) {
    super(TierConfigModel, unitOfWork);
  }

  async findAll(): Promise<ITierConfigDoc[]> {
    return await this.model.find({}).sort({ rate_limit_rpm: 1 }).lean().exec() as unknown as ITierConfigDoc[];
  }

  async findByTier(tier: string): Promise<ITierConfigDoc | null> {
    const normalized = tier.trim().toLowerCase();
    return await this.model.findOne({ tier: normalized }).lean().exec() as unknown as ITierConfigDoc | null;
  }

  async updateByTier(tier: string, data: Partial<ITierConfigDoc>): Promise<ITierConfigDoc | null> {
    const normalized = tier.trim().toLowerCase();
    const session = this.unitOfWork?.getSession();
    return await this.model
      .findOneAndUpdate(
        { tier: normalized },
        { $set: data, $setOnInsert: { _id: `tier_${normalized}`, tier: normalized } },
        { returnDocument: 'after', session, lean: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec() as unknown as ITierConfigDoc | null;
  }

  async bulkUpsert(configs: Partial<ITierConfigDoc>[]): Promise<void> {
    if (!configs || configs.length === 0) return;
    const operations = configs.map((cfg) => ({
      updateOne: {
        filter: { tier: cfg.tier },
        update: { $set: cfg },
        upsert: true,
      },
    }));
    await this.model.bulkWrite(operations);
  }
}

