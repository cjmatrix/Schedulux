import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CrawlSiteRequest, GetCrawlStatusRequest } from '@repo/proto/knowledge';

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
