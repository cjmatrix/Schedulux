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
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.js';
let CrawlProducer = class CrawlProducer {
    redisClient;
    crawlQueue;
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.crawlQueue = new Queue('knowledge-crawl-queue', {
            connection: this.redisClient,
        });
    }
    async enqueueCrawlJob(data) {
        const job = await this.crawlQueue.add('crawl-site', data, {
            jobId: data.job_id,
            attempts: 2,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: false,
            removeOnFail: false,
        });
        return job.id;
    }
};
CrawlProducer = __decorate([
    Injectable(),
    __param(0, Inject(REDIS_CLIENT)),
    __metadata("design:paramtypes", [Redis])
], CrawlProducer);
export { CrawlProducer };
