"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    _configService;
    _logger = new common_1.Logger(RedisService_1.name);
    _client;
    _subscriber;
    _eventHandlers = [];
    constructor(_configService) {
        this._configService = _configService;
    }
    onModuleInit() {
        const redisUri = this._configService.get('REDIS_URI') || process.env.REDIS_URI;
        const redisHost = this._configService.get('REDIS_HOST') || process.env.REDIS_HOST || 'localhost';
        const redisPort = Number(this._configService.get('REDIS_PORT') || process.env.REDIS_PORT || 6379);
        if (redisUri) {
            this._logger.log(`Connecting to Redis via URI: ${redisUri}`);
            this._client = new ioredis_1.Redis(redisUri);
            this._subscriber = new ioredis_1.Redis(redisUri);
        }
        else {
            this._logger.log(`Connecting to Redis: ${redisHost}:${redisPort}`);
            this._client = new ioredis_1.Redis({ host: redisHost, port: redisPort });
            this._subscriber = new ioredis_1.Redis({ host: redisHost, port: redisPort });
        }
        const channel = 'schema-generation-events';
        this._subscriber.subscribe(channel, (err) => {
            if (err) {
                this._logger.error(`Failed to subscribe to ${channel} channel`, err);
            }
            else {
                this._logger.log(`Subscribed to Redis channel: ${channel}`);
            }
        });
        this._subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    const parsed = JSON.parse(message);
                    this._logger.log(`Received schema event for tenant ${parsed.tenant_id}, job ${parsed.job_id}`);
                    for (const handler of this._eventHandlers) {
                        handler(parsed);
                    }
                }
                catch (e) {
                    this._logger.error('Error parsing Redis Pub/Sub message', e);
                }
            }
        });
    }
    onSchemaGenerated(callback) {
        this._eventHandlers.push(callback);
    }
    async getDraftSchema(tenantId, jobId) {
        const key = jobId ? `agent:draft:${tenantId}:${jobId}` : `agent:draft:${tenantId}`;
        try {
            const raw = await this._client.get(key);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch (err) {
            this._logger.error(`Failed to retrieve draft schema for key: ${key}`, err);
            return null;
        }
    }
    async onModuleDestroy() {
        this._logger.log('Disconnecting from Redis');
        if (this._subscriber)
            await this._subscriber.quit();
        if (this._client)
            await this._client.quit();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
