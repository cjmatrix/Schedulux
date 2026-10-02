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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const nestjs_zod_1 = require("nestjs-zod");
const knowledge_dto_js_1 = require("./dtos/knowledge.dto.js");
let KnowledgeController = class KnowledgeController {
    client;
    knowledgeService;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.knowledgeService = this.client.getService("KnowledgeService");
    }
    async crawlSite(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.knowledgeService.crawlSite({
            tenant_id: body.tenant_id,
            url: body.url,
        }));
        return {
            message: response.message,
            data: {
                job_id: response.job_id,
                status: response.status,
            },
        };
    }
    async getCrawlStatus(query) {
        const response = await (0, rxjs_1.lastValueFrom)(this.knowledgeService.getCrawlStatus({
            tenant_id: query.tenant_id,
            job_id: query.job_id,
        }));
        return {
            message: "Crawl status retrieved successfully",
            data: response,
        };
    }
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Post)("crawl"),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.CrawlSiteDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "crawlSite", null);
__decorate([
    (0, common_1.Get)("crawl/status"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.GetCrawlStatusDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getCrawlStatus", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)("api/v1/tenant/knowledge"),
    __param(0, (0, common_1.Inject)("KNOWLEDGE_PACKAGE")),
    __metadata("design:paramtypes", [Object])
], KnowledgeController);
