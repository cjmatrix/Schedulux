import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  agent_id: z.string().optional(),
});

export class ListCustomersQueryDto extends createZodDto(ListCustomersQuerySchema) {}

