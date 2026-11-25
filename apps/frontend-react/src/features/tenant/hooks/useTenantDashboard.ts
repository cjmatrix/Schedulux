import { useQuery } from '@tanstack/react-query';
import { tenantDashboardApi, type TenantDashboardOverviewData } from '../api/tenantDashboardApi';

export const TENANT_DASHBOARD_KEYS = {
  all: ['tenant-dashboard'] as const,
  overview: (agentId?: string) =>
    [...TENANT_DASHBOARD_KEYS.all, 'overview', agentId || 'default'] as const,
};

export function useTenantDashboardOverview(agentId?: string) {
  return useQuery<TenantDashboardOverviewData, Error>({
    queryKey: TENANT_DASHBOARD_KEYS.overview(agentId),
    queryFn: () => tenantDashboardApi.getOverview(agentId),
    staleTime: 30 * 1000,
  });
}
