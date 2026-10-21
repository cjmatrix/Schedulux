import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateResourceDtoSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  resource_type: z
    .enum(['staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle'])
    .default('staff'),
  name: z.string().min(1, 'Resource name is required').trim(),
  title: z.string().optional().default(''),
  category: z.string().optional().default('General'),
  description: z.string().optional().default(''),
  is_bookable: z.boolean().optional().default(true),
  dispatch_status: z
    .enum(['active', 'on_leave', 'maintenance', 'retired', 'inactive'])
    .default('active'),
  custom_shift_overrides_json: z.string().optional().default('{}'),
});

export class CreateResourceDto extends createZodDto(CreateResourceDtoSchema) {}

export const UpdateResourceDtoSchema = z.object({
  agent_id: z.string().optional(),
  resource_type: z
    .enum(['staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle'])
    .optional(),
  name: z.string().min(1).trim().optional(),
  title: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  is_bookable: z.boolean().optional(),
  dispatch_status: z.enum(['active', 'on_leave', 'maintenance', 'retired', 'inactive']).optional(),
  custom_shift_overrides_json: z.string().optional(),
});

export class UpdateResourceDto extends createZodDto(UpdateResourceDtoSchema) {}

export const ListResourcesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  resource_type: z.string().optional(),
  dispatch_status: z.string().optional(),
  category: z.string().optional(),
  agent_id: z.string().optional(),
  search: z.string().optional(),
});

export class ListResourcesQueryDto extends createZodDto(ListResourcesQuerySchema) {}
