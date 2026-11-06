import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBookingDtoSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  service_id: z.string().min(1, 'service_id is required'),
  resource_id: z.string().optional(),
  resource_ids: z.array(z.string()).optional(),
  start_time: z.string().min(1, 'start_time is required'),
  end_time: z.string().optional(),
  customer_name: z.string().min(1, 'customer_name is required').trim(),
  customer_phone: z.string().min(1, 'customer_phone is required').trim(),
  customer_email: z.string().email('Invalid email address').optional().or(z.literal('')).or(z.null()),
  notes: z.string().optional(),
  source: z.enum(['manual', 'customer_agent', 'web_portal', 'sandbox_simulation']).optional().default('manual'),
  deposit_status: z.enum(['not_required', 'pending', 'verified', 'waived']).optional(),
  created_by: z.string().optional(),
});

export class CreateBookingDto extends createZodDto(CreateBookingDtoSchema) {}

export const CancelBookingDtoSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  reason: z.string().optional(),
});

export class CancelBookingDto extends createZodDto(CancelBookingDtoSchema) {}

export const RescheduleBookingDtoSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  new_start_time: z.string().min(1, 'new_start_time is required'),
  new_end_time: z.string().optional(),
  resource_id: z.string().optional(),
  resource_ids: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export class RescheduleBookingDto extends createZodDto(RescheduleBookingDtoSchema) {}

export const ListBookingsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  agent_id: z.string().optional(),
  service_id: z.string().optional(),
  resource_id: z.string().optional(),
  status: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().optional(),
});

export class ListBookingsQueryDto extends createZodDto(ListBookingsQuerySchema) {}

