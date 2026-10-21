import { LoginRequest, LogoutRequest, RefreshTokenRequest } from '@repo/proto/superadmin';
import { ListTenantsRequest } from '@repo/proto/tenant';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SuperAdminLoginSchema: z.ZodType<LoginRequest> = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class SuperAdminLoginDto extends createZodDto(SuperAdminLoginSchema) {}

export const SuperAdminRefreshTokenSchema: z.ZodType<RefreshTokenRequest> = z.object({
  refresh_token: z.string().default(''),
});

export class SuperAdminRefreshTokenDto extends createZodDto(SuperAdminRefreshTokenSchema) {}

export const SuperAdminLogoutSchema: z.ZodType<LogoutRequest> = z.object({
  refresh_token: z.string().default(''),
});

export class SuperAdminLogoutDto extends createZodDto(SuperAdminLogoutSchema) {}

export const ListTenantsSchema: z.ZodType<ListTenantsRequest> = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  tier: z.string().optional(),
  status: z.string().optional(),
});

export class ListTenantsDto extends createZodDto(ListTenantsSchema) {}

export const SuspendTenantParamSchema = z.object({
  id: z.string().min(1, 'Tenant ID is required'),
});

export class SuspendTenantParamDto extends createZodDto(SuspendTenantParamSchema) {}
