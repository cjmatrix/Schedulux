import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import './index.css';
import App from './App.tsx';
import AcceptInvitePage from './features/dashboard-user/AcceptInvitePage.tsx';
import DashboardUserLoginPage from './features/dashboard-user/DashboardUserLoginPage.tsx';
import AdminLayout from './features/superadmin/components/AdminLayout.tsx';
import { SuperAdminProtectedRoute } from './features/superadmin/components/SuperAdminProtectedRoute.tsx';
import GlobalSettingsPage from './features/superadmin/pages/GlobalSettingsPage.tsx';
import SuperAdminDashboard from './features/superadmin/pages/SuperAdminDashboard.tsx';

import SuperAdminLoginPage from './features/superadmin/pages/SuperAdminLoginPage.tsx';
import SystemHealthPage from './features/superadmin/pages/SystemHealthPage.tsx';
import TenantListPage from './features/superadmin/pages/TenantListPage.tsx';
import RateLimitsPage from './features/superadmin/pages/RateLimitsPage.tsx';
import { RoleProtectedRoute } from './features/tenant/components/RoleProtectedRoute.tsx';
import { TenantIndexRedirect } from './features/tenant/components/TenantIndexRedirect.tsx';
import { TenantProtectedRoute } from './features/tenant/components/TenantProtectedRoute.tsx';
import BookingsPage from './features/tenant/pages/BookingsPage.tsx';
import CustomersPage from './features/tenant/pages/CustomersPage.tsx';
import ForgotPasswordPage from './features/tenant/pages/ForgotPasswordPage.tsx';
import KnowledgeBasePage from './features/tenant/pages/KnowledgeBasePage.tsx';
import LoginPage from './features/tenant/pages/LoginPage.tsx';


import BillingPage from './features/tenant/pages/BillingPage.tsx';
import EmbedWidgetPage from './features/tenant/pages/EmbedWidgetPage.tsx';
import TenantLayout from './features/tenant/pages/layout/TenantLayout.tsx';
import RegisterPage from './features/tenant/pages/RegisterPage.tsx';
import ResetPasswordPage from './features/tenant/pages/ResetPasswordPage.tsx';
import ResourceEditorPage from './features/tenant/pages/ResourceEditorPage.tsx';
import ResourcesListPage from './features/tenant/pages/ResourcesListPage.tsx';
import ScheduleSettingsPage from './features/tenant/pages/ScheduleSettingsPage.tsx';
import ServiceEditorPage from './features/tenant/pages/ServiceEditorPage.tsx';
import ServicesListPage from './features/tenant/pages/ServicesListPage.tsx';
import TenantAgentsPage from './features/tenant/pages/TenantAgentsPage.tsx';
import TenantDashboardPage from './features/tenant/pages/TenantDashboardPage.tsx';
import VerifyEmailPage from './features/tenant/pages/VerifyEmailPage.tsx';
import WorkspaceUsersPage from './features/tenant/pages/WorkspaceUsersPage.tsx';
import AgentOnboardingWizard from './pages/AgentOnboardingWizard.tsx';
import LandingPage from './pages/LandingPage.tsx';
import SchedulingOnboarding from './pages/SchedulingOnboarding.tsx';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/home',
    element: <LandingPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboarduser/login',
    element: <DashboardUserLoginPage />,
  },
  {
    path: '/tenant/user-login',
    element: <DashboardUserLoginPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/dashboarduser/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/superadmin/login',
    element: <SuperAdminLoginPage />,
  },
  {
    path: '/superadmin',
    element: <SuperAdminProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/superadmin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <SuperAdminDashboard />,
          },
          {
            path: 'tenants',
            element: <TenantListPage />,
          },
          {
            path: 'rate-limits',
            element: <RateLimitsPage />,
          },
          {
            path: 'system-health',
            element: <SystemHealthPage />,
          },
          {
            path: 'settings',
            element: <GlobalSettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/tenant',
    element: <TenantProtectedRoute />,
    children: [
      {
        index: true,
        element: <TenantIndexRedirect />,
      },
      {
        path: 'agents',
        element: (
          <RoleProtectedRoute allowedRoles={['owner']}>
            <TenantAgentsPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'landingboard',
        element: (
          <RoleProtectedRoute allowedRoles={['owner']}>
            <SchedulingOnboarding />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'agent-setup/:id',
        element: (
          <RoleProtectedRoute allowedRoles={['owner']}>
            <AgentOnboardingWizard />
          </RoleProtectedRoute>
        ),
      },
      {
        element: <TenantLayout />,
        children: [
          // Owner Only Routes
          {
            path: 'dashboard',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <TenantDashboardPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agents/:agentId/dashboard',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <TenantDashboardPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'billing',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <BillingPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agents/:agentId/billing',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <BillingPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'users',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <WorkspaceUsersPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agents/:agentId/users',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <WorkspaceUsersPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agents/:agentId/knowledge',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <KnowledgeBasePage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'knowledge',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <KnowledgeBasePage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agents/:agentId/settings',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <ScheduleSettingsPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'settings',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <ScheduleSettingsPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agents/:agentId/widget',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <EmbedWidgetPage />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'widget',
            element: (
              <RoleProtectedRoute allowedRoles={['owner']}>
                <EmbedWidgetPage />
              </RoleProtectedRoute>
            ),
          },

          // Shared Operational Routes (Both Owner and Manager)
          {
            path: 'bookings',
            element: <BookingsPage />,
          },
          {
            path: 'agents/:agentId/bookings',
            element: <BookingsPage />,
          },
          {
            path: 'customers',
            element: <CustomersPage />,
          },
          {
            path: 'agents/:agentId/customers',
            element: <CustomersPage />,
          },
          {
            path: 'services',
            element: <ServicesListPage />,
          },
          {
            path: 'services/new',
            element: <ServiceEditorPage mode="create" />,
          },
          {
            path: 'services/:id',
            element: <ServiceEditorPage mode="edit" />,
          },
          {
            path: 'agents/:agentId/services',
            element: <ServicesListPage />,
          },
          {
            path: 'agents/:agentId/services/new',
            element: <ServiceEditorPage mode="create" />,
          },
          {
            path: 'agents/:agentId/services/:id',
            element: <ServiceEditorPage mode="edit" />,
          },
          {
            path: 'inventory',
            element: <ResourcesListPage />,
          },
          {
            path: 'inventory/new',
            element: <ResourceEditorPage mode="create" />,
          },
          {
            path: 'inventory/:id',
            element: <ResourceEditorPage mode="edit" />,
          },
          {
            path: 'resources',
            element: <Navigate to="/tenant/inventory" replace />,
          },
          {
            path: 'resources/new',
            element: <Navigate to="/tenant/inventory/new" replace />,
          },
          {
            path: 'resources/:id',
            element: <Navigate to="/tenant/inventory/:id" replace />,
          },
          {
            path: 'agents/:agentId/resources',
            element: <ResourcesListPage />,
          },
          {
            path: 'agents/:agentId/resources/new',
            element: <ResourceEditorPage mode="create" />,
          },
          {
            path: 'agents/:agentId/resources/:id',
            element: <ResourceEditorPage mode="edit" />,
          },
        ],
      },
    ],
  },
  {
    path: '/workspace/users',
    element: <Navigate to="/tenant/users" replace />,
  },
  {
    path: '/dashboarduser/accept-invite',
    element: <AcceptInvitePage />,
  },
  {
    path: '/dashboarduser',
    children: [
      {
        path: 'tenant/*',
        element: <Navigate to="/tenant/bookings" replace />,
      },
    ],
  },
]);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <>
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton visibleToasts={5} />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </>,
  );
}
