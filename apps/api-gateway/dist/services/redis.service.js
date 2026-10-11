"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client;
    subscriber;
    eventHandlers = [];
    onModuleInit() {
        const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';
        this.logger.log(`Connecting to Redis: ${redisUri}`);
        this.client = new ioredis_1.Redis(redisUri);
        this.subscriber = new ioredis_1.Redis(redisUri);
        this.subscriber.subscribe('schema-generation-events', (err) => {
            if (err) {
                this.logger.error('Failed to subscribe to schema-generation-events channel', err);
            }
            else {
                this.logger.log('Subscribed to Redis channel: schema-generation-events');
            }
        });
        this.subscriber.on('message', (channel, message) => {
            if (channel === 'schema-generation-events') {
                try {
                    const parsed = JSON.parse(message);
                    this.logger.log(`Received schema event for tenant ${parsed.tenant_id}, job ${parsed.job_id}`);
                    for (const handler of this.eventHandlers) {
                        handler(parsed);
                    }
                }
                catch (e) {
                    this.logger.error('Error parsing Redis Pub/Sub message', e);
                }
            }
        });
    }
    onSchemaGenerated(callback) {
        this.eventHandlers.push(callback);
    }
    async getDraftSchema(tenantId, jobId) {
        const key = jobId ? `agent:draft:${tenantId}:${jobId}` : `agent:draft:${tenantId}`;
        const raw = await this.client.get(key);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return raw;
        }
    }
    async onModuleDestroy() {
        this.logger.log('Disconnecting from Redis');
        if (this.subscriber)
            await this.subscriber.quit();
        if (this.client)
            await this.client.quit();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisService);
