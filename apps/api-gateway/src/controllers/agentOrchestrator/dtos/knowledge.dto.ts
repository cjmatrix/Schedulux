import { CrawlSiteRequest, GetCrawlStatusRequest } from '@repo/proto/knowledge';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CrawlSiteSchema: z.ZodType<CrawlSiteRequest> = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  url: z.string().trim().url('Please provide a valid URL'),
});

export class CrawlSiteDto extends createZodDto(CrawlSiteSchema) {}

export const GetCrawlStatusSchema: z.ZodType<GetCrawlStatusRequest> = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  job_id: z.string().min(1, 'Job ID is required'),
});

export class GetCrawlStatusDto extends createZodDto(GetCrawlStatusSchema) {}

export const StartOnboardingSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().optional(),
  initial_draft_json: z.string().optional().default('{}'),
});

export class StartOnboardingDto extends createZodDto(StartOnboardingSchema) {}

export const ResumeOnboardingSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
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

export const CustomerChatSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
  session_id: z.string().min(1, 'Session ID is required'),
  message: z.string().min(1, 'Message cannot be empty'),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
});

export class CustomerChatDto extends createZodDto(CustomerChatSchema) {}

export const SendSandboxMessageSchema = z.object({
  tenant_id: z.string().optional(),
  agent_id: z.string().optional(),
  session_id: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
});

export class SendSandboxMessageDto extends createZodDto(SendSandboxMessageSchema) {}

