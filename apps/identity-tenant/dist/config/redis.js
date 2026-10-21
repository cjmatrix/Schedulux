var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
export const REDIS_CLIENT = 'REDIS_CLIENT';
const redisProvider = {
    provide: REDIS_CLIENT,
    inject: [ConfigService],
    useFactory: (configService) => {
        const redisUri = configService.get('REDIS_URI') || 'redis://localhost:6379';
        const client = new Redis(redisUri, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
        client.on('connect', () => {
            console.log('Redis COnnected');
        });
        client.on('error', (error) => {
            console.log(`Redis connection error: ${error.message}`, error.stack);
        });
        return client;
    },
};
let RedisModule = class RedisModule {
};
RedisModule = __decorate([
    Global(),
    Module({
        providers: [redisProvider],
        exports: [REDIS_CLIENT],
    })
], RedisModule);
export { RedisModule };
