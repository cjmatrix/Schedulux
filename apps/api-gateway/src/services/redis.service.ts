import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import {
  ISchemaCacheService,
  ISchemaEventSubscriber,
  SchemaGeneratedEvent,
} from '../interfaces/ISchemaEventSubscriber.js';

export { SchemaGeneratedEvent };

@Injectable()
export class RedisService
  implements ISchemaEventSubscriber, ISchemaCacheService, OnModuleInit, OnModuleDestroy
{
  private readonly _logger = new Logger(RedisService.name);
  private _client!: Redis;
  private _subscriber!: Redis;
  private readonly _eventHandlers: ((event: SchemaGeneratedEvent) => void)[] = [];

  constructor(
    @Inject(ConfigService)
    private readonly _configService: ConfigService,
  ) {}

  onModuleInit() {
    const redisUri =
      this._configService.get<string>('REDIS_URI') || process.env.REDIS_URI;
    const redisHost =
      this._configService.get<string>('REDIS_HOST') || process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(
      this._configService.get<number>('REDIS_PORT') || process.env.REDIS_PORT || 6379,
    );

    if (redisUri) {
      this._logger.log(`Connecting to Redis via URI: ${redisUri}`);
      this._client = new Redis(redisUri);
      this._subscriber = new Redis(redisUri);
    } else {
      this._logger.log(`Connecting to Redis: ${redisHost}:${redisPort}`);
      this._client = new Redis({ host: redisHost, port: redisPort });
      this._subscriber = new Redis({ host: redisHost, port: redisPort });
    }

    const channel = 'schema-generation-events';
    this._subscriber.subscribe(channel, (err) => {
      if (err) {
        this._logger.error(`Failed to subscribe to ${channel} channel`, err);
      } else {
        this._logger.log(`Subscribed to Redis channel: ${channel}`);
      }
    });

    this._subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed: SchemaGeneratedEvent = JSON.parse(message);
          this._logger.log(
            `Received schema event for tenant ${parsed.tenant_id}, job ${parsed.job_id}`,
          );
          for (const handler of this._eventHandlers) {
            handler(parsed);
          }
        } catch (e) {
          this._logger.error('Error parsing Redis Pub/Sub message', e);
        }
      }
    });
  }

  onSchemaGenerated(callback: (event: SchemaGeneratedEvent) => void): void {
    this._eventHandlers.push(callback);
  }

  async getDraftSchema(tenantId: string, jobId?: string): Promise<Record<string, unknown> | null> {
    const key = jobId ? `agent:draft:${tenantId}:${jobId}` : `agent:draft:${tenantId}`;
    try {
      const raw = await this._client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      this._logger.error(`Failed to retrieve draft schema for key: ${key}`, err);
      return null;
    }
  }

  async onModuleDestroy() {
    this._logger.log('Disconnecting from Redis');
    if (this._subscriber) await this._subscriber.quit();
    if (this._client) await this._client.quit();
  }
}

