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
import { Injectable, Inject } from '@nestjs/common';
let CacheRepository = class CacheRepository {
    redisClient;
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    async get(key) {
        return await this.redisClient.get(key);
    }
    async set(key, value, options) {
        await this.redisClient.set(key, value, options);
    }
    async delete(key) {
        const result = await this.redisClient.del(key);
        return result > 0;
    }
    async ttl(key) {
        return await this.redisClient.ttl(key);
    }
    async exists(key) {
        const result = await this.redisClient.exists(key);
        return result > 0;
    }
};
CacheRepository = __decorate([
    Injectable(),
    __param(0, Inject('REDIS_CLIENT')),
    __metadata("design:paramtypes", [Object])
], CacheRepository);
export { CacheRepository };
