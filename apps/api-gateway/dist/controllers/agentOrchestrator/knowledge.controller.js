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
const nestjs_zod_1 = require("nestjs-zod");
const rxjs_1 = require("rxjs");
const messages_constant_js_1 = require("../../constants/messages.constant.js");
const routes_constant_js_1 = require("../../constants/routes.constant.js");
const roles_decorator_js_1 = require("../../decorators/roles.decorator.js");
const roles_guard_js_1 = require("../../guards/roles.guard.js");
const tenant_auth_guard_js_1 = require("../../guards/tenant-auth.guard.js");
const knowledge_dto_js_1 = require("./dtos/knowledge.dto.js");
let KnowledgeController = class KnowledgeController {
    _client;
    _schemaCacheService;
    _knowledgeService;
    constructor(_client, _schemaCacheService) {
        this._client = _client;
        this._schemaCacheService = _schemaCacheService;
    }
    onModuleInit() {
        this._knowledgeService = this._client.getService('KnowledgeService');
    }
    async crawlSite(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.crawlSite({
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
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getCrawlStatus({
            tenant_id: query.tenant_id,
            job_id: query.job_id,
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.CRAWL_STATUS_RETRIEVED,
            data: response,
        };
    }
    async getSchema(tenantId, jobId) {
        if (!tenantId) {
            return {
                message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.TENANT_ID_REQUIRED,
                data: null,
            };
        }
        const schema = await this._schemaCacheService.getDraftSchema(tenantId, jobId);
        if (!schema) {
            return {
                message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.SCHEMA_PENDING,
                data: {
                    status: 'pending',
                    schema: null,
                },
            };
        }
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.SCHEMA_RETRIEVED,
            data: {
                status: 'completed',
                schema,
            },
        };
    }
    async startOnboarding(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.startOnboardingSession({
            tenant_id: body.tenant_id,
            initial_draft_json: body.initial_draft_json || '{}',
            agent_id: body.agent_id || '',
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.SESSION_STARTED,
            data: {
                status: response.status,
                question: response.question,
                field: response.field,
                type: response.type,
                draft_schema: JSON.parse(response.draft_schema_json || '{}'),
                live_schema: JSON.parse(response.live_schema_json || '{}'),
            },
        };
    }
    async resumeOnboarding(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.resumeOnboardingSession({
            tenant_id: body.tenant_id,
            user_answer: body.user_answer,
            agent_id: body.agent_id || '',
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.MESSAGE_PROCESSED,
            data: {
                status: response.status,
                question: response.question,
                field: response.field,
                type: response.type,
                draft_schema: JSON.parse(response.draft_schema_json || '{}'),
                live_schema: JSON.parse(response.live_schema_json || '{}'),
            },
        };
    }
    async sandboxChat(req, body) {
        const tenantId = body.tenant_id || req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const agentId = body.agent_id || 'default';
        const sessionId = body.session_id || `sandbox_${tenantId}_${agentId}`;
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.customerChat({
            tenant_id: tenantId,
            agent_id: agentId,
            session_id: sessionId,
            message: body.message,
            customer_id: body.customer_id || '',
            customer_phone: body.customer_phone || '',
            customer_name: body.customer_name || 'Sandbox Tester',
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.SANDBOX_CHAT_PROCESSED,
            data: {
                reply: response.response,
                session_id: response.session_id,
                history: response.history || [],
            },
        };
    }
    async saveInitialDraft(req, body) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id || body.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.saveInitialAgentDraft({
            tenant_id: tenantId,
            draft_json: body.draft_json || '',
            creation_source: body.creation_source || 'web_crawl',
            name: body.name || '',
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
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.listTenantAgents({
            tenant_id: tenantId,
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.AGENTS_RETRIEVED,
            data: response.agents || [],
        };
    }
    async getAgentMessages(req, agentId, limitStr, before) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const limit = limitStr ? parseInt(limitStr, 10) : 20;
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getAgentMessages({
            tenant_id: tenantId,
            agent_id: agentId,
            limit,
            before,
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
            data: {
                messages: response.messages || [],
                next_cursor: response.next_cursor || null,
                has_more: response.has_more ?? false,
            },
        };
    }
    async getOnboardingMessages(req, agentIdQuery, limitStr, before) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        if (!agentIdQuery) {
            throw new common_1.BadRequestException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.AGENT_ID_REQUIRED);
        }
        const limit = limitStr ? parseInt(limitStr, 10) : 50;
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getAgentMessages({
            tenant_id: tenantId,
            agent_id: agentIdQuery,
            limit,
            before,
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
            data: {
                messages: response.messages || [],
                next_cursor: response.next_cursor || null,
                has_more: response.has_more ?? false,
            },
        };
    }
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.CRAWL),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.CrawlSiteDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "crawlSite", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.CRAWL_STATUS),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.GetCrawlStatusDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getCrawlStatus", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.SCHEMA),
    __param(0, (0, common_1.Query)('tenant_id')),
    __param(1, (0, common_1.Query)('job_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getSchema", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_START),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.StartOnboardingDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "startOnboarding", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_MESSAGE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_js_1.ResumeOnboardingDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "resumeOnboarding", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.SendSandboxMessageDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "sandboxChat", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.AGENTS_DRAFT),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.SaveInitialAgentDraftDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "saveInitialDraft", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.AGENTS),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "listAgents", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.AGENT_MESSAGES),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('agentId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getAgentMessages", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_MESSAGES),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('agent_id')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getOnboardingMessages", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.BASE),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('tenant_owner', 'root'),
    __param(0, (0, common_1.Inject)('KNOWLEDGE_PACKAGE')),
    __param(1, (0, common_1.Inject)('ISchemaCacheService')),
    __metadata("design:paramtypes", [Object, Object])
], KnowledgeController);
