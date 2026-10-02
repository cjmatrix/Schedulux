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
import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { KnowledgeService } from "../services/knowledgeService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";
let KnowledgeController = class KnowledgeController {
    knowledgeService;
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
    }
    async crawlSite(data) {
        const { tenant_id, url } = data;
        if (!tenant_id || !url) {
            throw new Error("Missing required fields");
        }
        return await this.knowledgeService.crawlSite(tenant_id, url);
    }
    async getCrawlStatus(data) {
        const { tenant_id, job_id } = data;
        if (!tenant_id || !job_id) {
            throw new Error("Missing required fields");
        }
        return await this.knowledgeService.getCrawlStatus(tenant_id, job_id);
    }
};
__decorate([
    GrpcMethod("KnowledgeService", "CrawlSite"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "crawlSite", null);
__decorate([
    GrpcMethod("KnowledgeService", "GetCrawlStatus"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getCrawlStatus", null);
KnowledgeController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __param(0, Inject(KnowledgeService)),
    __metadata("design:paramtypes", [KnowledgeService])
], KnowledgeController);
export { KnowledgeController };
