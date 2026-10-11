import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  ISchemaEventSubscriber,
  ISchemaCacheService,
  SchemaGeneratedEvent,
} from '../interfaces/ISchemaEventSubscriber.js';

export { SchemaGeneratedEvent };

@Injectable()
export class RedisService implements ISchemaEventSubscriber, ISchemaCacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private subscriber!: Redis;
  private readonly eventHandlers: ((event: SchemaGeneratedEvent) => void)[] = [];

  onModuleInit() {
    const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';
    this.logger.log(`Connecting to Redis: ${redisUri}`);

    this.client = new Redis(redisUri);
    this.subscriber = new Redis(redisUri);

    this.subscriber.subscribe('schema-generation-events', (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to schema-generation-events channel', err);
      } else {
        this.logger.log('Subscribed to Redis channel: schema-generation-events');
      }
    });

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'schema-generation-events') {
        try {
          const parsed: SchemaGeneratedEvent = JSON.parse(message);
          this.logger.log(`Received schema event for tenant ${parsed.tenant_id}, job ${parsed.job_id}`);
          for (const handler of this.eventHandlers) {
            handler(parsed);
          }
        } catch (e) {
          this.logger.error('Error parsing Redis Pub/Sub message', e);
        }
      }
    });
  }

  onSchemaGenerated(callback: (event: SchemaGeneratedEvent) => void): void {
    this.eventHandlers.push(callback);
  }

  async getDraftSchema(tenantId: string, jobId?: string): Promise<any | null> {
    const key = jobId ? `agent:draft:${tenantId}:${jobId}` : `agent:draft:${tenantId}`;
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Redis');
    if (this.subscriber) await this.subscriber.quit();
    if (this.client) await this.client.quit();
  }
}
