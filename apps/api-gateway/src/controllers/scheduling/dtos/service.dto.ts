import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PriceDtoSchema = z.object({
  type: z.enum(['fixed', 'starting_at', 'hourly', 'free', 'custom']).default('fixed'),
  amount: z.number().nonnegative().default(0),
  currency: z.string().default('USD'),
});

export const DepositDtoSchema = z.object({
  required: z.boolean().default(false),
  amount: z.number().nonnegative().default(0),
  processor: z.string().optional().default(''),
  upi_id: z.string().optional().default(''),
  qr_code_url: z.string().optional().default(''),
  confirmation_method: z.string().optional().default('automatic'),
  payment_instructions: z.string().optional().default(''),
});

export const ServiceVerificationDtoSchema = z.object({
  require_otp: z.boolean().nullable().optional(),
});

export const ResourceRequirementDtoSchema = z.object({
  role: z.string().default('Staff'),
  resource_type: z.string().default('staff'),
  count: z.number().int().min(1).default(1),
  eligible_resource_ids: z.array(z.string()).default([]),
  selection_mode: z.enum(['user_selectable', 'auto_assign']).optional().default('auto_assign'),
});

export class ResourceRequirementDto extends createZodDto(ResourceRequirementDtoSchema) {}

export const CreateServiceDtoSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  name: z.string().min(1, 'Service name is required').trim(),
  category: z.string().optional().default('General'),
  description: z.string().optional().default(''),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').default(30),
  buffer_minutes: z.number().int().min(0).default(0),
  booking_mode: z.enum(['time_slot', 'date_range']).default('time_slot'),
  price: PriceDtoSchema.optional().default({ type: 'fixed', amount: 0, currency: 'USD' }),
  deposit: DepositDtoSchema.optional().default({
    required: false,
    amount: 0,
    processor: '',
    upi_id: '',
    qr_code_url: '',
    confirmation_method: 'automatic',
    payment_instructions: '',
  }),
  verification: ServiceVerificationDtoSchema.optional(),
  resource_requirements: z.array(ResourceRequirementDtoSchema).optional().default([]),
  recall_interval_days: z.number().int().min(0).optional().default(0),
});

export class CreateServiceDto extends createZodDto(CreateServiceDtoSchema) {}

export const UpdateServiceDtoSchema = z.object({
  agent_id: z.string().optional(),
  name: z.string().min(1).trim().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(1).optional(),
  buffer_minutes: z.number().int().min(0).optional(),
  booking_mode: z.enum(['time_slot', 'date_range']).optional(),
  price: PriceDtoSchema.optional(),
  deposit: DepositDtoSchema.optional(),
  verification: ServiceVerificationDtoSchema.optional(),
  resource_requirements: z.array(ResourceRequirementDtoSchema).optional(),
  recall_interval_days: z.number().int().min(0).optional(),
});

export class UpdateServiceDto extends createZodDto(UpdateServiceDtoSchema) {}

export const ListServicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  agent_id: z.string().optional(),
  search: z.string().optional(),
});

export class ListServicesQueryDto extends createZodDto(ListServicesQuerySchema) {}
