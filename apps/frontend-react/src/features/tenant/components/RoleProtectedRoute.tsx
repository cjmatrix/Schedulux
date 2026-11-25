import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { toast } from 'sonner';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

interface RoleProtectedRouteProps {
  allowedRoles: ('owner' | 'manager')[];
  fallbackPath?: string;
  children?: ReactNode;
}

export function RoleProtectedRoute({
  allowedRoles,
  fallbackPath = '/tenant/bookings',
  children,
}: RoleProtectedRouteProps) {
  const { isOwner, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentRole: 'owner' | 'manager' = isOwner ? 'owner' : 'manager';

  if (!allowedRoles.includes(currentRole)) {
    toast.error('Access restricted. You do not have permission to view that page.');
    return <Navigate to={fallbackPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
