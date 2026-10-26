import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetAvailabilityQueryDtoSchema = z.object({
  service_id: z.string().min(1, 'service_id is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').optional(),
  agent_id: z.string().optional(),
  resource_id: z.string().optional(),
  resource_ids: z.array(z.string()).optional(),
  timezone: z.string().optional(),
});

export class GetAvailabilityQueryDto extends createZodDto(GetAvailabilityQueryDtoSchema) {}
