import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateTierConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  max_agents: z.coerce.number().int().optional(),
  max_services: z.coerce.number().int().optional(),
  max_resources: z.coerce.number().int().optional(),
  max_kb_docs: z.coerce.number().int().optional(),
  max_kb_doc_size_mb: z.coerce.number().int().positive().optional(),
  weekly_token_limit: z.coerce.number().int().optional(),
  rate_limit_rpm: z.coerce.number().int().min(1).max(100000).optional(),
  weekly_crawl_limit: z.coerce.number().int().optional(),
  status: z.enum(['active', 'deprecated', 'inactive']).optional(),
  description: z.string().max(500).optional(),
});

export class UpdateTierConfigDto extends createZodDto(UpdateTierConfigSchema) {}
