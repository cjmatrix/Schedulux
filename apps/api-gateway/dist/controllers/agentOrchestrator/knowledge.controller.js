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
const tenant_auth_guard_js_1 = require("../../guards/tenant-auth.guard.js");
const roles_guard_js_1 = require("../../guards/roles.guard.js");
const roles_decorator_js_1 = require("../../decorators/roles.decorator.js");
let KnowledgeController = class KnowledgeController {
    client;
    schemaCacheService;
    knowledgeService;
    constructor(client, schemaCacheService) {
        this.client = client;
        this.schemaCacheService = schemaCacheService;
    }
    onModuleInit() {
        this.knowledgeService = this.client.getService("KnowledgeService");
    }
    async crawlSite(body) {
        console.log("crawling");
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
    async getSchema(tenantId, jobId) {
        if (!tenantId) {
            return {
                message: "tenant_id is required",
                data: null,
            };
        }
        const schema = await this.schemaCacheService.getDraftSchema(tenantId, jobId);
        if (!schema) {
            return {
                message: "Draft schema is still being generated or not found",
                data: {
                    status: "pending",
                    schema: null,
                },
            };
        }
        return {
            message: "Draft schema retrieved successfully",
            data: {
                status: "completed",
                schema,
            },
        };
    }
    async startOnboarding(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.knowledgeService.startOnboardingSession({
            tenant_id: body.tenant_id,
            initial_draft_json: body.initial_draft_json || "{}",
            agent_id: body.agent_id || "",
        }));
        return {
            message: "Session started",
            data: {
                status: response.status,
                question: response.question,
                field: response.field,
                type: response.type,
                draft_schema: JSON.parse(response.draft_schema_json || '{}')
            }
        };
    }
    async resumeOnboarding(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.knowledgeService.resumeOnboardingSession({
            tenant_id: body.tenant_id,
            user_answer: body.user_answer,
            agent_id: body.agent_id || "",
        }));
        return {
            message: "Message processed",
            data: {
                status: response.status,
                question: response.question,
                field: response.field,
                type: response.type,
                draft_schema: JSON.parse(response.draft_schema_json || '{}')
            }
        };
    }
    async saveInitialDraft(req, body) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id || body.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException("Tenant ID is required");
        }
        const response = await (0, rxjs_1.lastValueFrom)(this.knowledgeService.saveInitialAgentDraft({
            tenant_id: tenantId,
            draft_json: body.draft_json || "",
            creation_source: body.creation_source || "web_crawl",
            name: body.name || "",
        }));
        return {
            message: response.message,
            data: {
                agent_id: response.agent_id,
                status: response.status,
            },
        };
    }
    async listAgents(req) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException("Tenant ID is required");
        }
        const response = await (0, rxjs_1.lastValueFrom)(this.knowledgeService.listTenantAgents({
            tenant_id: tenantId,
        }));
        return {
            message: "Agents retrieved successfully",
            data: response.agents || [],
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
__decorate([
    (0, common_1.Get)("schema"),
    __param(0, (0, common_1.Query)("tenant_id")),
    __param(1, (0, common_1.Query)("job_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getSchema", null);
__decorate([
    (0, common_1.Post)("onboarding/start"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.StartOnboardingDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "startOnboarding", null);
__decorate([
    (0, common_1.Post)("onboarding/message"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.ResumeOnboardingDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "resumeOnboarding", null);
__decorate([
    (0, common_1.Post)("agents/draft"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.SaveInitialAgentDraftDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "saveInitialDraft", null);
__decorate([
    (0, common_1.Get)("agents"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "listAgents", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)("api/v1/tenant/knowledge"),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)("tenant_owner", "root"),
    __param(0, (0, common_1.Inject)("KNOWLEDGE_PACKAGE")),
    __param(1, (0, common_1.Inject)("ISchemaCacheService")),
    __metadata("design:paramtypes", [Object, Object])
], KnowledgeController);
