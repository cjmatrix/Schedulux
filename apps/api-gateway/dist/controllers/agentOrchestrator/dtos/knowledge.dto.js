"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendSandboxMessageDto = exports.SendSandboxMessageSchema = exports.CustomerChatDto = exports.CustomerChatSchema = exports.SaveInitialAgentDraftDto = exports.SaveInitialAgentDraftSchema = exports.ResumeOnboardingDto = exports.ResumeOnboardingSchema = exports.StartOnboardingDto = exports.StartOnboardingSchema = exports.GetCrawlStatusDto = exports.GetCrawlStatusSchema = exports.CrawlSiteDto = exports.CrawlSiteSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.CrawlSiteSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    url: zod_1.z.string().trim().url('Please provide a valid URL'),
});
class CrawlSiteDto extends (0, nestjs_zod_1.createZodDto)(exports.CrawlSiteSchema) {
}
exports.CrawlSiteDto = CrawlSiteDto;
exports.GetCrawlStatusSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    job_id: zod_1.z.string().min(1, 'Job ID is required'),
});
class GetCrawlStatusDto extends (0, nestjs_zod_1.createZodDto)(exports.GetCrawlStatusSchema) {
}
exports.GetCrawlStatusDto = GetCrawlStatusDto;
exports.StartOnboardingSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().optional(),
    initial_draft_json: zod_1.z.string().optional().default('{}'),
});
class StartOnboardingDto extends (0, nestjs_zod_1.createZodDto)(exports.StartOnboardingSchema) {
}
exports.StartOnboardingDto = StartOnboardingDto;
exports.ResumeOnboardingSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().optional(),
    user_answer: zod_1.z.string().min(1, 'User answer is required'),
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
exports.CustomerChatSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    agent_id: zod_1.z.string().min(1, 'Agent ID is required'),
    session_id: zod_1.z.string().min(1, 'Session ID is required'),
    message: zod_1.z.string().min(1, 'Message cannot be empty'),
    customer_id: zod_1.z.string().optional(),
    customer_phone: zod_1.z.string().optional(),
    customer_name: zod_1.z.string().optional(),
});
class CustomerChatDto extends (0, nestjs_zod_1.createZodDto)(exports.CustomerChatSchema) {
}
exports.CustomerChatDto = CustomerChatDto;
exports.SendSandboxMessageSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().optional(),
    session_id: zod_1.z.string().optional(),
    message: zod_1.z.string().min(1, 'Message cannot be empty'),
    customer_id: zod_1.z.string().optional(),
    customer_phone: zod_1.z.string().optional(),
    customer_name: zod_1.z.string().optional(),
});
class SendSandboxMessageDto extends (0, nestjs_zod_1.createZodDto)(exports.SendSandboxMessageSchema) {
}
exports.SendSandboxMessageDto = SendSandboxMessageDto;
