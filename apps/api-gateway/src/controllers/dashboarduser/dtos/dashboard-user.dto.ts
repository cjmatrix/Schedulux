import { DashboardUserLoginRequest } from '@repo/proto/dashboard';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DashboardUserLoginSchema: z.ZodType<DashboardUserLoginRequest> = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
  agent_id: z.string().optional(),
});

export class DashboardUserLoginDto extends createZodDto(DashboardUserLoginSchema) {}

export const DashboardUserRefreshTokenSchema = z.object({
  refresh_token: z.string().optional(),
});

export class DashboardUserRefreshTokenDto extends createZodDto(DashboardUserRefreshTokenSchema) {}

export const DashboardUserForgotPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
});

export class DashboardUserForgotPasswordDto extends createZodDto(
  DashboardUserForgotPasswordSchema,
) {}

export const DashboardUserResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class DashboardUserResetPasswordDto extends createZodDto(DashboardUserResetPasswordSchema) {}

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class AcceptInvitationDto extends createZodDto(AcceptInvitationSchema) {}

export const GetInvitationDetailsSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export class GetInvitationDetailsDto extends createZodDto(GetInvitationDetailsSchema) {}

