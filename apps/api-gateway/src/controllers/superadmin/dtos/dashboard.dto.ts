import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DashboardDateQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class DashboardDateQueryDto extends createZodDto(DashboardDateQuerySchema) {}

export const RevenueChartQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interval: z.enum(['day', 'week', 'month']).default('day'),
});

export class RevenueChartQueryDto extends createZodDto(RevenueChartQuerySchema) {}

export const TokenChartQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interval: z.enum(['day', 'month']).default('day'),
});

export class TokenChartQueryDto extends createZodDto(TokenChartQuerySchema) {}

export const TopTenantsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export class TopTenantsQueryDto extends createZodDto(TopTenantsQuerySchema) {}
