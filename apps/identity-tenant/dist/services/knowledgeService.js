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
import { nanoid } from 'nanoid';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.js';
let KnowledgeService = class KnowledgeService {
    crawlProducer;
    redisClient;
    crawlQueue;
    constructor(crawlProducer, redisClient) {
        this.crawlProducer = crawlProducer;
        this.redisClient = redisClient;
        this.crawlQueue = new Queue('knowledge-crawl-queue', {
            connection: this.redisClient,
        });
    }
    async crawlSite(tenant_id, url) {
        const job_id = `crawl_${nanoid(12)}`;
        await this.crawlProducer.enqueueCrawlJob({
            tenant_id,
            url,
            job_id,
        });
        return {
            message: 'Crawl job queued successfully',
            job_id,
            status: 'queued',
        };
    }
    async getCrawlStatus(tenant_id, job_id) {
        const job = await this.crawlQueue.getJob(job_id);
        if (!job) {
            throw new Error('CRAWL_JOB_NOT_FOUND');
        }
        const state = await job.getState();
        let pages = [];
        let pages_crawled = 0;
        if (state === 'completed' && job.returnvalue) {
            const result = job.returnvalue;
            pages = Object.entries(result).map(([pageUrl, markdown]) => ({
                url: pageUrl,
                markdown: markdown,
                success: true,
                error: '',
            }));
            pages_crawled = pages.length;
        }
        return {
            job_id,
            status: state,
            pages_crawled,
            pages,
        };
    }
};
KnowledgeService = __decorate([
    Injectable(),
    __param(0, Inject('ICrawlProducer')),
    __param(1, Inject(REDIS_CLIENT)),
    __metadata("design:paramtypes", [Object, Redis])
], KnowledgeService);
export { KnowledgeService };
