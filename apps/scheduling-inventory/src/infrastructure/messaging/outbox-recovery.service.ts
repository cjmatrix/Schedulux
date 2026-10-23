import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { IOutboxRepository } from '../../domain/repositories/outbox.repository.interface.js';
import { MESSAGING_SERVICE, OUTBOX_REPOSITORY } from '../../domain/tokens.js';
import { OutboxModel } from '../database/schemas/outbox.schema.js';

@Injectable()
export class OutboxRecoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRecoveryService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @Inject(MESSAGING_SERVICE)
    private readonly messagingClient: ClientProxy,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  onModuleInit() {
    this.logger.log('[OutboxRecovery] Starting background recovery task (interval: 10s)...');
    this.timer = setInterval(() => {
      this.sweepStuckEvents().catch((err) => {
        this.logger.error(`[OutboxRecovery] Error in background sweep: ${(err as Error).message}`);
      });
    }, 10_000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async sweepStuckEvents(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

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

      this.logger.log(
        `[OutboxRecovery] Found ${stuck.length} un-published/stuck outbox events. Retrying...`,
      );

      for (const event of stuck) {
        try {
          const key = event.partition_key;
          const value = JSON.stringify(event.payload);
          this.messagingClient.emit(event.topic, { key, value });
          await this.outboxRepository.markPublished([event._id]);
          this.logger.log(
            `[OutboxRecovery] Recovered and published event ${event._id} to ${event.topic}`,
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(`[OutboxRecovery] Failed to recover event ${event._id}: ${errMsg}`);
          await this.outboxRepository.markFailed(event._id, errMsg);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
