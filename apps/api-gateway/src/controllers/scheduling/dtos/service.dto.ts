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

export const CreateServiceDtoSchema = z.object({
  name: z.string().min(1, 'Service name is required').trim(),
  category: z.string().optional().default('General'),
  description: z.string().optional().default(''),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').default(30),
  buffer_minutes: z.number().int().min(0).default(0),
  allocation_model: z.enum(['single_resource', 'multi_resource', 'pooled', 'asset_only']).default('single_resource'),
  price: PriceDtoSchema.optional().default({ type: 'fixed', amount: 0, currency: 'USD' }),
  deposit: DepositDtoSchema.optional().default({ required: false, amount: 0, processor: '', upi_id: '', qr_code_url: '', confirmation_method: 'automatic', payment_instructions: '' }),
  eligible_resource_ids: z.array(z.string()).optional().default([]),
  required_asset_ids: z.array(z.string()).optional().default([]),
  recall_interval_days: z.number().int().min(0).optional().default(0),
});

export class CreateServiceDto extends createZodDto(CreateServiceDtoSchema) {}

export const UpdateServiceDtoSchema = z.object({
  name: z.string().min(1).trim().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(1).optional(),
  buffer_minutes: z.number().int().min(0).optional(),
  allocation_model: z.enum(['single_resource', 'multi_resource', 'pooled', 'asset_only']).optional(),
  price: PriceDtoSchema.optional(),
  deposit: DepositDtoSchema.optional(),
  eligible_resource_ids: z.array(z.string()).optional(),
  required_asset_ids: z.array(z.string()).optional(),
  recall_interval_days: z.number().int().min(0).optional(),
});

export class UpdateServiceDto extends createZodDto(UpdateServiceDtoSchema) {}

export const ListServicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
});

export class ListServicesQueryDto extends createZodDto(ListServicesQuerySchema) {}
