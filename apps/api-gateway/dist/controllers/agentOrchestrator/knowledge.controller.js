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
const session_token_util_js_1 = require("../../utils/session-token.util.js");
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
    async sandboxInit(req, body) {
        const tenantId = body.tenant_id || req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const agentId = body.agent_id || 'default';
        let resolvedSessionId;
        let resolvedToken;
        let isFirstTime = true;
        let messages = [];
        if (body.token) {
            const verified = (0, session_token_util_js_1.verifySessionToken)(body.token);
            if (verified.valid && verified.sessionId) {
                resolvedSessionId = verified.sessionId;
                resolvedToken = body.token;
            }
        }
        else if (body.session_id) {
            resolvedSessionId = body.session_id;
            resolvedToken = (0, session_token_util_js_1.signSessionId)(body.session_id);
        }
        if (resolvedSessionId && resolvedToken) {
            try {
                const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getCustomerMessages({
                    tenant_id: tenantId,
                    agent_id: agentId,
                    session_id: resolvedSessionId,
                    limit: 20,
                }));
                messages = response.messages || [];
                isFirstTime = messages.length === 0;
                return {
                    message: messages_constant_js_1.RESPONSE_MESSAGES.CHAT.SESSION_INITIALIZED,
                    data: {
                        is_first_time: isFirstTime,
                        session_id: resolvedSessionId,
                        token: resolvedToken,
                        messages,
                        next_cursor: response.next_cursor || null,
                        has_more: Boolean(response.has_more),
                    },
                };
            }
            catch {
                isFirstTime = true;
                messages = [];
            }
        }
        else {
            const session = (0, session_token_util_js_1.createSignedSession)(`sandbox_${tenantId}_${agentId}`);
            resolvedSessionId = session.sessionId;
            resolvedToken = session.token;
            isFirstTime = true;
            messages = [];
        }
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.CHAT.SESSION_INITIALIZED,
            data: {
                is_first_time: isFirstTime,
                session_id: resolvedSessionId,
                token: resolvedToken,
                messages,
                next_cursor: null,
                has_more: false,
            },
        };
    }
    async getSandboxWidgetConfig(req, tenantIdParam, agentIdParam) {
        const tenantId = tenantIdParam || req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const agentId = agentIdParam || 'default';
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getWidgetConfig({
            tenant_id: tenantId,
            agent_id: agentId,
            source: 'draft',
        }));
        let widgetConfig = {};
        if (response.widget_config_json) {
            try {
                widgetConfig = JSON.parse(response.widget_config_json);
            }
            catch {
                widgetConfig = {};
            }
        }
        return {
            message: 'Sandbox widget configuration retrieved',
            data: {
                tenant_id: response.tenant_id || tenantId,
                agent_id: response.agent_id || agentId,
                widget_config: widgetConfig,
            },
        };
    }
    async getSandboxMessages(req, agentIdParam, sessionIdParam, token, before, limitStr) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const agentId = agentIdParam || 'default';
        let resolvedSessionId = sessionIdParam;
        if (token) {
            const verified = (0, session_token_util_js_1.verifySessionToken)(token);
            if (!verified.valid || !verified.sessionId) {
                throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
            }
            resolvedSessionId = verified.sessionId;
        }
        if (!resolvedSessionId) {
            throw new common_1.BadRequestException(messages_constant_js_1.RESPONSE_MESSAGES.CHAT.REQUIRED_FIELDS);
        }
        const limit = limitStr ? parseInt(limitStr, 10) : 20;
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getCustomerMessages({
            tenant_id: tenantId,
            agent_id: agentId,
            session_id: resolvedSessionId,
            limit,
            before,
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
            data: {
                messages: response.messages || [],
                next_cursor: response.next_cursor || null,
                has_more: Boolean(response.has_more),
            },
        };
    }
    async sandboxChat(req, body) {
        const tenantId = body.tenant_id || req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const agentId = body.agent_id || 'default';
        let sessionId = body.session_id;
        let token = body.token;
        if (token) {
            const verified = (0, session_token_util_js_1.verifySessionToken)(token);
            if (!verified.valid || !verified.sessionId) {
                throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
            }
            sessionId = verified.sessionId;
        }
        else if (sessionId) {
            token = (0, session_token_util_js_1.signSessionId)(sessionId);
        }
        else {
            const session = (0, session_token_util_js_1.createSignedSession)(`sandbox_${tenantId}_${agentId}`);
            sessionId = session.sessionId;
            token = session.token;
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.customerChat({
            tenant_id: tenantId,
            agent_id: agentId,
            session_id: sessionId,
            message: body.message,
            customer_id: body.customer_id || '',
            customer_phone: body.customer_phone || '',
            customer_name: body.customer_name || 'Sandbox Tester',
            mode: 'sandbox',
        }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.KNOWLEDGE.SANDBOX_CHAT_PROCESSED,
            data: {
                reply: response.response,
                response: response.response,
                session_id: response.session_id,
                token,
                user_message_id: response.user_message_id,
                agent_message_id: response.agent_message_id,
                created_at: response.created_at,
                booking_id: response.booking_id || undefined,
                booking_reference: response.booking_reference || undefined,
                status: response.status || undefined,
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
    async getDocumentUploadUrl(req, body) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.getDocumentUploadUrl({
            tenant_id: tenantId,
            agent_id: body.agent_id,
            file_name: body.file_name,
            file_size_bytes: body.file_size_bytes || 0,
        }));
        return {
            message: 'Presigned upload URL generated successfully',
            data: {
                upload_url: response.upload_url,
                document_id: response.document_id,
                s3_key: response.s3_key,
                expires_in: response.expires_in,
            },
        };
    }
    async confirmDocumentUpload(req, body) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.confirmDocumentUpload({
            tenant_id: tenantId,
            document_id: body.document_id,
        }));
        return {
            message: response.message,
            data: { success: response.success },
        };
    }
    async listDocuments(req, query) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.listDocuments({
            tenant_id: tenantId,
            agent_id: query.agent_id || '',
        }));
        return {
            message: 'Documents retrieved successfully',
            data: response.documents || [],
        };
    }
    async deleteDocument(req, documentId) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._knowledgeService.deleteDocument({
            tenant_id: tenantId,
            document_id: documentId,
        }));
        return {
            message: response.message,
            data: { success: response.success },
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
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_INIT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.InitCustomerChatDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "sandboxInit", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_CONFIG),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('tenant_id')),
    __param(2, (0, common_1.Query)('agent_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getSandboxWidgetConfig", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_MESSAGES),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('agent_id')),
    __param(2, (0, common_1.Query)('session_id')),
    __param(3, (0, common_1.Query)('token')),
    __param(4, (0, common_1.Query)('before')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getSandboxMessages", null);
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
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.DOCUMENTS_UPLOAD_URL),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.GetDocumentUploadUrlDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getDocumentUploadUrl", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.DOCUMENTS_CONFIRM),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.ConfirmDocumentUploadDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "confirmDocumentUpload", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.DOCUMENTS),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_js_1.ListDocumentsQueryDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "listDocuments", null);
__decorate([
    (0, common_1.Delete)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.DOCUMENT_BY_ID),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "deleteDocument", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)(routes_constant_js_1.API_ROUTES.KNOWLEDGE.BASE),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('tenant_owner', 'root'),
    __param(0, (0, common_1.Inject)('KNOWLEDGE_PACKAGE')),
    __param(1, (0, common_1.Inject)('ISchemaCacheService')),
    __metadata("design:paramtypes", [Object, Object])
], KnowledgeController);
