import { useAuthStore, type UserData } from '../store/useAuthStore';
import { useDashboardAuthStore } from '../store/useDashboardAuthStore';

export function useCurrentUser(): {
  user: UserData | null;
  isAuthenticated: boolean;
  isDashboardUser: boolean;
  isManager: boolean;
  isOwner: boolean;
} {
  const tenantUser = useAuthStore((state) => state.user);
  const isTenantAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const dashboardUser = useDashboardAuthStore((state) => state.user);
  const isDashboardAuthenticated = useDashboardAuthStore((state) => state.isAuthenticated);

  if (isDashboardAuthenticated && dashboardUser) {
    const mappedUser: UserData = {
      tenant_id: dashboardUser.tenant_id,
      user_id: dashboardUser.user_id,
      agent_id: dashboardUser.agent_id,
      agent_ids: dashboardUser.agent_ids,
      email: dashboardUser.email,
      name: dashboardUser.name,
      system_role: 'manager',
      created_at: dashboardUser.created_at,
    };

    return {
      user: mappedUser,
      isAuthenticated: true,
      isDashboardUser: true,
      isManager: true,
      isOwner: false,
    };
  }

  if (isTenantAuthenticated && tenantUser) {
    const isOwner = !tenantUser.system_role || tenantUser.system_role === 'owner';
    return {
      user: tenantUser,
      isAuthenticated: true,
      isDashboardUser: false,
      isManager: tenantUser.system_role === 'manager',
      isOwner,
    };
  }

  return {
    user: null,
    isAuthenticated: false,
    isDashboardUser: false,
    isManager: false,
    isOwner: false,
  };
}
