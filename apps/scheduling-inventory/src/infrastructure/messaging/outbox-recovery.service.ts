import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { IOutboxRepository } from '../../domain/repositories/outbox.repository.interface.js';
import { MESSAGING_SERVICE, OUTBOX_REPOSITORY } from '../../domain/tokens.js';
import { OutboxModel } from '../database/schemas/outbox.schema.js';

@Injectable()
export class OutboxRecoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly _logger = new Logger(OutboxRecoveryService.name);
  private _timer: NodeJS.Timeout | null = null;
  private _isRunning = false;

  constructor(
    @Inject(MESSAGING_SERVICE)
    private readonly _messagingClient: ClientProxy,
    @Inject(OUTBOX_REPOSITORY)
    private readonly _outboxRepository: IOutboxRepository,
  ) {}

  onModuleInit() {
    this._logger.log('[OutboxRecovery] Starting background recovery task (interval: 10s)...');
    this._timer = setInterval(() => {
      this.sweepStuckEvents().catch((err) => {
        this._logger.error(`[OutboxRecovery] Error in background sweep: ${(err as Error).message}`);
      });
    }, 10_000);
  }

  onModuleDestroy() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async sweepStuckEvents(): Promise<void> {
    if (this._isRunning) return;
    this._isRunning = true;

    try {
      const gracePeriod = new Date(Date.now() - 5000);
      const stuck = await OutboxModel.find({
        status: 'PENDING',
        created_at: { $lte: gracePeriod },
      })
        .sort({ created_at: 1 })
        .limit(50)
        .exec();

      if (!stuck || stuck.length === 0) {
        return;
      }

      this._logger.log(
        `[OutboxRecovery] Found ${stuck.length} un-published/stuck outbox events. Retrying...`,
      );

      for (const event of stuck) {
        try {
          const key = event.partition_key;
          const value = JSON.stringify(event.payload);
          this._messagingClient.emit(event.topic, { key, value });
          await this._outboxRepository.markPublished([event._id]);
          this._logger.log(
            `[OutboxRecovery] Recovered and published event ${event._id} to ${event.topic}`,
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this._logger.error(`[OutboxRecovery] Failed to recover event ${event._id}: ${errMsg}`);
          await this._outboxRepository.markFailed(event._id, errMsg);
        }
      }
    } finally {
      this._isRunning = false;
    }
  }
}
