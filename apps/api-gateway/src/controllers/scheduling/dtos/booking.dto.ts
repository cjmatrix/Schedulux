import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBookingDtoSchema = z.object({
  agent_id: z.string().optional(),
  service_id: z.string().min(1, 'service_id is required'),
  resource_id: z.string().optional(),
  resource_ids: z.array(z.string()).optional(),
  start_time: z.string().min(1, 'start_time is required'),
  end_time: z.string().optional(),
  customer_name: z.string().min(1, 'customer_name is required').trim(),
  customer_phone: z.string().min(1, 'customer_phone is required').trim(),
  customer_email: z.string().email('Invalid email address').optional().or(z.literal('')).or(z.null()),
  notes: z.string().optional(),
  source: z.enum(['manual', 'customer_agent', 'web_portal']).optional().default('manual'),
  deposit_status: z.enum(['not_required', 'pending', 'verified', 'waived']).optional(),
  created_by: z.string().optional(),
});

export class CreateBookingDto extends createZodDto(CreateBookingDtoSchema) {}
