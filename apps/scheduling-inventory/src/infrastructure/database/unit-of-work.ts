import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, Logger } from '@nestjs/common';
import mongoose, { ClientSession } from 'mongoose';

import type { IUnitOfWork } from '../../domain/repositories/unit-of-work.interface.js';

export type { IUnitOfWork };

@Injectable()
export class UnitOfWork implements IUnitOfWork {
  private readonly logger = new Logger(UnitOfWork.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<ClientSession>();

  getSession(): ClientSession | undefined {
    return this.asyncLocalStorage.getStore();
  }

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();

    let result: T | undefined;
    try {
      try {
        await session.withTransaction(async () => {
          result = await this.asyncLocalStorage.run(session, work);
        });
        if (result === undefined) {
          throw new Error('[UnitOfWork] Transaction completed without a result');
        }
        return result;
      } catch (txErr: unknown) {
        const msg = txErr instanceof Error ? txErr.message : String(txErr);
        if (
          msg.includes('Transaction numbers are only allowed on a replica set member or mongos')
        ) {
          this.logger.warn(
            '[UnitOfWork] MongoDB is standalone (no replica set). Falling back to non-transactional execution.',
          );
          return await work();
        }
        throw txErr;
      }
    } finally {
      await session.endSession();
    }
  }
}
