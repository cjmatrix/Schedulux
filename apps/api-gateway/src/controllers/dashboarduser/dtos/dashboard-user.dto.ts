import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DashboardUserLoginRequest } from '@repo/proto/dashboard';

export const DashboardUserLoginSchema: z.ZodType<DashboardUserLoginRequest> = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class DashboardUserLoginDto extends createZodDto(DashboardUserLoginSchema) {}

export const DashboardUserRefreshTokenSchema = z.object({
  refresh_token: z.string().optional(),
});

export class DashboardUserRefreshTokenDto extends createZodDto(DashboardUserRefreshTokenSchema) {}
