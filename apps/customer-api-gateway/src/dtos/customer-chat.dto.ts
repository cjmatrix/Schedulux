import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const InitCustomerChatSchema = z.object({
  tenant_id: z.string().min(1, 'tenant_id is required'),
  agent_id: z.string().min(1, 'agent_id is required'),
  session_id: z.string().optional(),
  token: z.string().optional(),
});

export class InitCustomerChatDto extends createZodDto(InitCustomerChatSchema) {}

export const CustomerChatSchema = z.object({
  tenant_id: z.string().min(1, 'tenant_id is required'),
  agent_id: z.string().min(1, 'agent_id is required'),
  session_id: z.string().optional(),
  token: z.string().optional(),
  message: z.string().min(1, 'message is required'),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
});

export class CustomerChatDto extends createZodDto(CustomerChatSchema) {}

export const PublicChatConfigQuerySchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
});

export class PublicChatConfigQueryDto extends createZodDto(PublicChatConfigQuerySchema) {}

export const PublicChatMessagesQuerySchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  agent_id: z.string().min(1, 'Agent ID is required'),
  session_id: z.string().optional(),
  token: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.string().optional(),
});

export class PublicChatMessagesQueryDto extends createZodDto(PublicChatMessagesQuerySchema) {}

