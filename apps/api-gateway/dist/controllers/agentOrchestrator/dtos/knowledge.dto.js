"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWidgetConfigDto = exports.UpdateWidgetConfigSchema = exports.PublicChatMessagesQueryDto = exports.PublicChatMessagesQuerySchema = exports.PublicChatConfigQueryDto = exports.PublicChatConfigQuerySchema = exports.ListDocumentsQueryDto = exports.ListDocumentsQuerySchema = exports.ConfirmDocumentUploadDto = exports.ConfirmDocumentUploadSchema = exports.GetDocumentUploadUrlDto = exports.GetDocumentUploadUrlSchema = exports.GetOnboardingMessagesQueryDto = exports.GetOnboardingMessagesQuerySchema = exports.GetAgentMessagesQueryDto = exports.GetAgentMessagesQuerySchema = exports.GetSandboxMessagesQueryDto = exports.GetSandboxMessagesQuerySchema = exports.GetSandboxWidgetConfigQueryDto = exports.GetSandboxWidgetConfigQuerySchema = exports.SendSandboxMessageDto = exports.SendSandboxMessageSchema = exports.CustomerChatDto = exports.CustomerChatSchema = exports.InitSandboxChatDto = exports.InitSandboxChatSchema = exports.InitCustomerChatDto = exports.InitCustomerChatSchema = exports.SaveInitialAgentDraftDto = exports.SaveInitialAgentDraftSchema = exports.ResumeOnboardingDto = exports.ResumeOnboardingSchema = exports.MAX_CUSTOMER_MESSAGE_CHARS = exports.MAX_TENANT_MESSAGE_CHARS = exports.StartOnboardingDto = exports.StartOnboardingSchema = exports.GetSchemaQueryDto = exports.GetSchemaQuerySchema = exports.GetCrawlStatusDto = exports.GetCrawlStatusSchema = exports.CrawlSiteDto = exports.CrawlSiteSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.CrawlSiteSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    url: zod_1.z.string().trim().url('Please provide a valid URL'),
});
class CrawlSiteDto extends (0, nestjs_zod_1.createZodDto)(exports.CrawlSiteSchema) {
}
exports.CrawlSiteDto = CrawlSiteDto;
exports.GetCrawlStatusSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    job_id: zod_1.z.string().min(1, 'Job ID is required'),
});
class GetCrawlStatusDto extends (0, nestjs_zod_1.createZodDto)(exports.GetCrawlStatusSchema) {
}
exports.GetCrawlStatusDto = GetCrawlStatusDto;
exports.GetSchemaQuerySchema = zod_1.z.object({
    job_id: zod_1.z.string().optional(),
});
class GetSchemaQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.GetSchemaQuerySchema) {
}
exports.GetSchemaQueryDto = GetSchemaQueryDto;
exports.StartOnboardingSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().optional(),
    initial_draft_json: zod_1.z.string().optional().default('{}'),
});
class StartOnboardingDto extends (0, nestjs_zod_1.createZodDto)(exports.StartOnboardingSchema) {
}
exports.StartOnboardingDto = StartOnboardingDto;
exports.MAX_TENANT_MESSAGE_CHARS = 20000; // ~5,000 tokens (1 token ≈ 4 chars)
exports.MAX_CUSTOMER_MESSAGE_CHARS = 4000; // ~1,000 tokens (1 token ≈ 4 chars)
exports.ResumeOnboardingSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().optional(),
    user_answer: zod_1.z
        .string()
        .trim()
        .min(1, 'User answer is required')
        .max(exports.MAX_TENANT_MESSAGE_CHARS, 'Input exceeds the 5,000-token (20,000-character) limit'),
});
class ResumeOnboardingDto extends (0, nestjs_zod_1.createZodDto)(exports.ResumeOnboardingSchema) {
}
exports.ResumeOnboardingDto = ResumeOnboardingDto;
exports.SaveInitialAgentDraftSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    draft_json: zod_1.z.string().optional(),
    creation_source: zod_1.z
        .enum(['medical', 'auto', 'hospitality', 'custom', 'web_crawl'])
        .optional()
        .default('web_crawl'),
    name: zod_1.z.string().optional(),
});
class SaveInitialAgentDraftDto extends (0, nestjs_zod_1.createZodDto)(exports.SaveInitialAgentDraftSchema) {
}
exports.SaveInitialAgentDraftDto = SaveInitialAgentDraftDto;
exports.InitCustomerChatSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().min(1, 'Agent ID is required'),
    token: zod_1.z.string().optional(),
    session_id: zod_1.z.string().optional(),
});
class InitCustomerChatDto extends (0, nestjs_zod_1.createZodDto)(exports.InitCustomerChatSchema) {
}
exports.InitCustomerChatDto = InitCustomerChatDto;
exports.InitSandboxChatSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().optional().default('default'),
    token: zod_1.z.string().optional(),
    session_id: zod_1.z.string().optional(),
});
class InitSandboxChatDto extends (0, nestjs_zod_1.createZodDto)(exports.InitSandboxChatSchema) {
}
exports.InitSandboxChatDto = InitSandboxChatDto;
exports.CustomerChatSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().min(1, 'Agent ID is required'),
    session_id: zod_1.z.string().optional(),
    token: zod_1.z.string().optional(),
    message: zod_1.z
        .string()
        .trim()
        .min(1, 'Message cannot be empty')
        .max(exports.MAX_CUSTOMER_MESSAGE_CHARS, 'Message exceeds the 1,000-token (4,000-character) limit'),
    customer_id: zod_1.z.string().optional(),
    customer_phone: zod_1.z.string().optional(),
    customer_name: zod_1.z.string().optional(),
});
class CustomerChatDto extends (0, nestjs_zod_1.createZodDto)(exports.CustomerChatSchema) {
}
exports.CustomerChatDto = CustomerChatDto;
exports.SendSandboxMessageSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().optional().default('default'),
    session_id: zod_1.z.string().optional(),
    token: zod_1.z.string().optional(),
    message: zod_1.z
        .string()
        .trim()
        .min(1, 'Message cannot be empty')
        .max(exports.MAX_CUSTOMER_MESSAGE_CHARS, 'Message exceeds the 1,000-token (4,000-character) limit'),
    customer_id: zod_1.z.string().optional(),
    customer_phone: zod_1.z.string().optional(),
    customer_name: zod_1.z.string().optional(),
});
class SendSandboxMessageDto extends (0, nestjs_zod_1.createZodDto)(exports.SendSandboxMessageSchema) {
}
exports.SendSandboxMessageDto = SendSandboxMessageDto;
exports.GetSandboxWidgetConfigQuerySchema = zod_1.z.object({
    agent_id: zod_1.z.string().optional().default('default'),
});
class GetSandboxWidgetConfigQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.GetSandboxWidgetConfigQuerySchema) {
}
exports.GetSandboxWidgetConfigQueryDto = GetSandboxWidgetConfigQueryDto;
exports.GetSandboxMessagesQuerySchema = zod_1.z.object({
    agent_id: zod_1.z.string().optional().default('default'),
    session_id: zod_1.z.string().optional(),
    token: zod_1.z.string().optional(),
    before: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
class GetSandboxMessagesQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.GetSandboxMessagesQuerySchema) {
}
exports.GetSandboxMessagesQueryDto = GetSandboxMessagesQueryDto;
exports.GetAgentMessagesQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    before: zod_1.z.string().optional(),
});
class GetAgentMessagesQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.GetAgentMessagesQuerySchema) {
}
exports.GetAgentMessagesQueryDto = GetAgentMessagesQueryDto;
exports.GetOnboardingMessagesQuerySchema = zod_1.z.object({
    agent_id: zod_1.z.string().min(1, 'agent_id is required'),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    before: zod_1.z.string().optional(),
});
class GetOnboardingMessagesQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.GetOnboardingMessagesQuerySchema) {
}
exports.GetOnboardingMessagesQueryDto = GetOnboardingMessagesQueryDto;
exports.GetDocumentUploadUrlSchema = zod_1.z.object({
    agent_id: zod_1.z.string().min(1, 'Agent ID is required'),
    file_name: zod_1.z
        .string()
        .min(1, 'File name is required')
        .max(255, 'File name exceeds 255 characters')
        .regex(/\.pdf$/i, 'Only PDF documents (.pdf) are supported'),
    file_size_bytes: zod_1.z
        .number()
        .nonnegative()
        .max(250 * 1024 * 1024, 'File size exceeds maximum platform limit of 250MB')
        .optional()
        .default(0),
});
class GetDocumentUploadUrlDto extends (0, nestjs_zod_1.createZodDto)(exports.GetDocumentUploadUrlSchema) {
}
exports.GetDocumentUploadUrlDto = GetDocumentUploadUrlDto;
exports.ConfirmDocumentUploadSchema = zod_1.z.object({
    document_id: zod_1.z.string().min(1, 'Document ID is required'),
});
class ConfirmDocumentUploadDto extends (0, nestjs_zod_1.createZodDto)(exports.ConfirmDocumentUploadSchema) {
}
exports.ConfirmDocumentUploadDto = ConfirmDocumentUploadDto;
exports.ListDocumentsQuerySchema = zod_1.z.object({
    agent_id: zod_1.z.string().optional(),
});
class ListDocumentsQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.ListDocumentsQuerySchema) {
}
exports.ListDocumentsQueryDto = ListDocumentsQueryDto;
exports.PublicChatConfigQuerySchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().min(1, 'Agent ID is required'),
});
class PublicChatConfigQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.PublicChatConfigQuerySchema) {
}
exports.PublicChatConfigQueryDto = PublicChatConfigQueryDto;
exports.PublicChatMessagesQuerySchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().min(1, 'Agent ID is required'),
    session_id: zod_1.z.string().optional(),
    token: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    before: zod_1.z.string().optional(),
});
class PublicChatMessagesQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.PublicChatMessagesQuerySchema) {
}
exports.PublicChatMessagesQueryDto = PublicChatMessagesQueryDto;
exports.UpdateWidgetConfigSchema = zod_1.z.object({
    whitelisted_domains: zod_1.z.array(zod_1.z.string().trim()).default([]),
    widget_config_json: zod_1.z.string().optional(),
});
class UpdateWidgetConfigDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateWidgetConfigSchema) {
}
exports.UpdateWidgetConfigDto = UpdateWidgetConfigDto;
