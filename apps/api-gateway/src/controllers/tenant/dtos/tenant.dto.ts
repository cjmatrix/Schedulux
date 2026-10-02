import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { LoginRequest, RegisterRequest, VerifyEmailRequest, RefreshTokenRequest, LogoutRequest, TenantGoogleLoginRequest } from '@repo/proto/tenant';
import { InviteUserRequest, ListWorkspaceUsersRequest } from '@repo/proto/dashboard';

export const TenantGoogleLoginSchema: z.ZodType<TenantGoogleLoginRequest> = z.object({
  id_token: z.string().min(1, 'Google ID token is required'),
});

export class TenantGoogleLoginDto extends createZodDto(TenantGoogleLoginSchema) {}

export const TenantRegisterSchema: z.ZodType<RegisterRequest> = z.object({
  business_name: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export class TenantRegisterDto extends createZodDto(TenantRegisterSchema) {}

export const TenantLoginSchema: z.ZodType<LoginRequest> = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class TenantLoginDto extends createZodDto(TenantLoginSchema) {}

export const VerifyEmailSchema: z.ZodType<VerifyEmailRequest> = z.object({
  token: z.string().min(1, 'Token is required'),
});

export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}

export const RefreshTokenSchema: z.ZodType<RefreshTokenRequest> = z.object({
  refresh_token: z.string().default(''),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

export const LogoutSchema: z.ZodType<LogoutRequest> = z.object({
  refresh_token: z.string().default(''),
});

export class LogoutDto extends createZodDto(LogoutSchema) {}

export const InviteUserSchema: z.ZodType<InviteUserRequest> = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  email: z.string().trim().email('Please provide a valid email address'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  system_role: z.string().min(1, 'System role is required'),
});

export class InviteUserDto extends createZodDto(InviteUserSchema) {}

export const ListWorkspaceUsersSchema: z.ZodType<ListWorkspaceUsersRequest> = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
});

export class ListWorkspaceUsersDto extends createZodDto(ListWorkspaceUsersSchema) {}


