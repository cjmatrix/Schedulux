import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CrawlSiteSchema = z.object({
  tenant_id: z.string().optional(),
  url: z.string().trim().url('Please provide a valid URL'),
});

export class CrawlSiteDto extends createZodDto(CrawlSiteSchema) {}

export const GetCrawlStatusSchema = z.object({
  tenant_id: z.string().optional(),
  job_id: z.string().min(1, 'Job ID is required'),
});

export class GetCrawlStatusDto extends createZodDto(GetCrawlStatusSchema) {}

export const GetSchemaQuerySchema = z.object({
  job_id: z.string().optional(),
});

export class GetSchemaQueryDto extends createZodDto(GetSchemaQuerySchema) {}

export const StartOnboardingSchema = z.object({
  tenant_id: z.string().optional(),
  agent_id: z.string().optional(),
  initial_draft_json: z.string().optional().default('{}'),
});

export class StartOnboardingDto extends createZodDto(StartOnboardingSchema) {}

export const ResumeOnboardingSchema = z.object({
  tenant_id: z.string().optional(),
  agent_id: z.string().optional(),
  user_answer: z.string().min(1, 'User answer is required'),
});

export class ResumeOnboardingDto extends createZodDto(ResumeOnboardingSchema) {}

export const SaveInitialAgentDraftSchema = z.object({
  tenant_id: z.string().optional(),
  draft_json: z.string().optional(),
  creation_source: z
    .enum(['medical', 'auto', 'hospitality', 'custom', 'web_crawl'])
    .optional()
    .default('web_crawl'),
  name: z.string().optional(),
});

export class SaveInitialAgentDraftDto extends createZodDto(SaveInitialAgentDraftSchema) {}

export const InitCustomerChatSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
  token: z.string().optional(),
  session_id: z.string().optional(),
});

export class InitCustomerChatDto extends createZodDto(InitCustomerChatSchema) {}

export const InitSandboxChatSchema = z.object({
  tenant_id: z.string().optional(),
  agent_id: z.string().optional().default('default'),
  token: z.string().optional(),
  session_id: z.string().optional(),
});

export class InitSandboxChatDto extends createZodDto(InitSandboxChatSchema) {}

export const CustomerChatSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
  session_id: z.string().optional(),
  token: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
});

export class CustomerChatDto extends createZodDto(CustomerChatSchema) {}

export const SendSandboxMessageSchema = z.object({
  tenant_id: z.string().optional(),
  agent_id: z.string().optional().default('default'),
  session_id: z.string().optional(),
  token: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
});

export class SendSandboxMessageDto extends createZodDto(SendSandboxMessageSchema) {}

export const GetSandboxWidgetConfigQuerySchema = z.object({
  agent_id: z.string().optional().default('default'),
});

export class GetSandboxWidgetConfigQueryDto extends createZodDto(GetSandboxWidgetConfigQuerySchema) {}

export const GetSandboxMessagesQuerySchema = z.object({
  agent_id: z.string().optional().default('default'),
  session_id: z.string().optional(),
  token: z.string().optional(),
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class GetSandboxMessagesQueryDto extends createZodDto(GetSandboxMessagesQuerySchema) {}

export const GetAgentMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.string().optional(),
});

export class GetAgentMessagesQueryDto extends createZodDto(GetAgentMessagesQuerySchema) {}

export const GetOnboardingMessagesQuerySchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().optional(),
});

export class GetOnboardingMessagesQueryDto extends createZodDto(GetOnboardingMessagesQuerySchema) {}

export const GetDocumentUploadUrlSchema = z.object({
  agent_id: z.string().min(1, 'Agent ID is required'),
  file_name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name exceeds 255 characters')
    .regex(/\.pdf$/i, 'Only PDF documents (.pdf) are supported'),
  file_size_bytes: z
    .number()
    .nonnegative()
    .max(250 * 1024 * 1024, 'File size exceeds maximum platform limit of 250MB')
    .optional()
    .default(0),
});

export class GetDocumentUploadUrlDto extends createZodDto(GetDocumentUploadUrlSchema) {}

export const ConfirmDocumentUploadSchema = z.object({
  document_id: z.string().min(1, 'Document ID is required'),
});

export class ConfirmDocumentUploadDto extends createZodDto(ConfirmDocumentUploadSchema) {}

export const ListDocumentsQuerySchema = z.object({
  agent_id: z.string().optional(),
});

export class ListDocumentsQueryDto extends createZodDto(ListDocumentsQuerySchema) {}

export const PublicChatConfigQuerySchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
});

export class PublicChatConfigQueryDto extends createZodDto(PublicChatConfigQuerySchema) {}

export const PublicChatMessagesQuerySchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
  session_id: z.string().optional(),
  token: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.string().optional(),
});

export class PublicChatMessagesQueryDto extends createZodDto(PublicChatMessagesQuerySchema) {}
