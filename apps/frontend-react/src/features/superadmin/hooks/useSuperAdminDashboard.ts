import { useQuery } from '@tanstack/react-query';
import {
  superAdminDashboardApi,
  type DashboardDateFilter,
  type RevenueDataPoint,
  type SuperAdminOverviewData,
  type TokenDataPoint,
  type TopTenantTokenUsage,
} from '../api/superAdminDashboardApi';

export const SUPERADMIN_DASHBOARD_KEYS = {
  all: ['superadmin-dashboard'] as const,
  overview: (filter?: DashboardDateFilter) =>
    [...SUPERADMIN_DASHBOARD_KEYS.all, 'overview', filter] as const,
  revenueChart: (filter?: DashboardDateFilter & { interval?: 'day' | 'week' | 'month' }) =>
    [...SUPERADMIN_DASHBOARD_KEYS.all, 'revenue-chart', filter] as const,
  tokenChart: (filter?: DashboardDateFilter & { interval?: 'day' | 'month' }) =>
    [...SUPERADMIN_DASHBOARD_KEYS.all, 'token-chart', filter] as const,
  topTenants: (filter?: DashboardDateFilter & { limit?: number }) =>
    [...SUPERADMIN_DASHBOARD_KEYS.all, 'top-tenants', filter] as const,
};

export function useSuperAdminOverview(filter?: DashboardDateFilter) {
  return useQuery<SuperAdminOverviewData, Error>({
    queryKey: SUPERADMIN_DASHBOARD_KEYS.overview(filter),
    queryFn: () => superAdminDashboardApi.getOverview(filter),
    staleTime: 60 * 1000,
  });
}

export function useSuperAdminRevenueChart(
  filter?: DashboardDateFilter & { interval?: 'day' | 'week' | 'month' },
) {
  return useQuery<RevenueDataPoint[], Error>({
    queryKey: SUPERADMIN_DASHBOARD_KEYS.revenueChart(filter),
    queryFn: () => superAdminDashboardApi.getRevenueChart(filter),
    staleTime: 60 * 1000,
  });
}

export function useSuperAdminTokenChart(
  filter?: DashboardDateFilter & { interval?: 'day' | 'month' },
) {
  return useQuery<TokenDataPoint[], Error>({
    queryKey: SUPERADMIN_DASHBOARD_KEYS.tokenChart(filter),
    queryFn: () => superAdminDashboardApi.getTokenChart(filter),
    staleTime: 60 * 1000,
  });
}

export function useSuperAdminTopTenants(
  filter?: DashboardDateFilter & { limit?: number },
) {
  return useQuery<TopTenantTokenUsage[], Error>({
    queryKey: SUPERADMIN_DASHBOARD_KEYS.topTenants(filter),
    queryFn: () => superAdminDashboardApi.getTopTenants(filter),
    staleTime: 60 * 1000,
  });
}
