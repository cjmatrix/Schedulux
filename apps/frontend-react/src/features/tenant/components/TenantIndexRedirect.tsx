import { Navigate } from 'react-router';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export function TenantIndexRedirect() {
  const { isManager } = useCurrentUser();

  if (isManager) {
    return <Navigate to="/tenant/bookings" replace />;
  }

  return <Navigate to="/tenant/dashboard" replace />;
}

