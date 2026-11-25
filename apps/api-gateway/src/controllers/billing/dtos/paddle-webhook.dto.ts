import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaddleWebhookSchema = z.object({
  event_id: z.string().min(1, 'event_id is required'),
  event_type: z.string().min(1, 'event_type is required'),
  occurred_at: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
});

export class PaddleWebhookDto extends createZodDto(PaddleWebhookSchema) {}
