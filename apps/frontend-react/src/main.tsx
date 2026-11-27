import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import './index.css';
import { SuperAdminProtectedRoute } from './features/superadmin/components/SuperAdminProtectedRoute.tsx';
import { RoleProtectedRoute } from './features/tenant/components/RoleProtectedRoute.tsx';
import { TenantIndexRedirect } from './features/tenant/components/TenantIndexRedirect.tsx';
import { TenantProtectedRoute } from './features/tenant/components/TenantProtectedRoute.tsx';

// Lazy-loaded Layouts & Pages (Route-level Code Splitting)
const App = lazy(() => import('./App.tsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.tsx'));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage.tsx'));
const SecurityPage = lazy(() => import('./pages/SecurityPage.tsx'));
const DocsPage = lazy(() => import('./pages/DocsPage.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const PublicChatPage = lazy(() => import('./features/public/pages/PublicChatPage.tsx'));

// Auth & Invite Pages
const LoginPage = lazy(() => import('./features/tenant/pages/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./features/tenant/pages/RegisterPage.tsx'));
const VerifyEmailPage = lazy(() => import('./features/tenant/pages/VerifyEmailPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./features/tenant/pages/ForgotPasswordPage.tsx'));
const ResetPasswordPage = lazy(() => import('./features/tenant/pages/ResetPasswordPage.tsx'));
const DashboardUserLoginPage = lazy(
  () => import('./features/dashboard-user/DashboardUserLoginPage.tsx'),
);
const AcceptInvitePage = lazy(() => import('./features/dashboard-user/AcceptInvitePage.tsx'));

// SuperAdmin Layout & Pages
const SuperAdminLoginPage = lazy(() => import('./features/superadmin/pages/SuperAdminLoginPage.tsx'));
const AdminLayout = lazy(() => import('./features/superadmin/components/AdminLayout.tsx'));
const SuperAdminDashboard = lazy(() => import('./features/superadmin/pages/SuperAdminDashboard.tsx'));
const TenantListPage = lazy(() => import('./features/superadmin/pages/TenantListPage.tsx'));
const RateLimitsPage = lazy(() => import('./features/superadmin/pages/RateLimitsPage.tsx'));
const SystemHealthPage = lazy(() => import('./features/superadmin/pages/SystemHealthPage.tsx'));
const GlobalSettingsPage = lazy(() => import('./features/superadmin/pages/GlobalSettingsPage.tsx'));

// Tenant Onboarding & Layout
const TenantAgentsPage = lazy(() => import('./features/tenant/pages/TenantAgentsPage.tsx'));
const SchedulingOnboarding = lazy(() => import('./pages/SchedulingOnboarding.tsx'));
const AgentOnboardingWizard = lazy(() => import('./pages/AgentOnboardingWizard.tsx'));
const TenantLayout = lazy(() => import('./features/tenant/pages/layout/TenantLayout.tsx'));

// Tenant Dashboard & Management Pages
const TenantDashboardPage = lazy(() => import('./features/tenant/pages/TenantDashboardPage.tsx'));
const BillingPage = lazy(() => import('./features/tenant/pages/BillingPage.tsx'));
const WorkspaceUsersPage = lazy(() => import('./features/tenant/pages/WorkspaceUsersPage.tsx'));
const KnowledgeBasePage = lazy(() => import('./features/tenant/pages/KnowledgeBasePage.tsx'));
const ScheduleSettingsPage = lazy(() => import('./features/tenant/pages/ScheduleSettingsPage.tsx'));
const EmbedWidgetPage = lazy(() => import('./features/tenant/pages/EmbedWidgetPage.tsx'));
const BookingsPage = lazy(() => import('./features/tenant/pages/BookingsPage.tsx'));
const CustomersPage = lazy(() => import('./features/tenant/pages/CustomersPage.tsx'));
const ServicesListPage = lazy(() => import('./features/tenant/pages/ServicesListPage.tsx'));
const ServiceEditorPage = lazy(() => import('./features/tenant/pages/ServiceEditorPage.tsx'));
const ResourcesListPage = lazy(() => import('./features/tenant/pages/ResourcesListPage.tsx'));
const ResourceEditorPage = lazy(() => import('./features/tenant/pages/ResourceEditorPage.tsx'));


function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
    </div>
  );
}


function withSuspense(element: ReactNode): ReactNode {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}


function ownerRoute(element: ReactNode): ReactNode {
  return (
    <RoleProtectedRoute allowedRoles={['owner']}>{withSuspense(element)}</RoleProtectedRoute>
  );
}

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
    element: withSuspense(<App />),
  },
  {
    path: '/home',
    element: withSuspense(<LandingPage />),
  },
  {
    path: '/product',
    element: withSuspense(<ProductPage />),
  },
  {
    path: '/solutions',
    element: withSuspense(<SolutionsPage />),
  },
  {
    path: '/security',
    element: withSuspense(<SecurityPage />),
  },
  {
    path: '/docs',
    element: withSuspense(<DocsPage />),
  },
  {
    path: '/pricing',
    element: withSuspense(<PricingPage />),
  },
  {
    path: '/register',
    element: withSuspense(<RegisterPage />),
  },
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/dashboarduser/login',
    element: withSuspense(<DashboardUserLoginPage />),
  },
  {
    path: '/tenant/user-login',
    element: withSuspense(<DashboardUserLoginPage />),
  },
  {
    path: '/verify-email',
    element: withSuspense(<VerifyEmailPage />),
  },
  {
    path: '/forgot-password',
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: '/dashboarduser/forgot-password',
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: '/reset-password',
    element: withSuspense(<ResetPasswordPage />),
  },
  {
    path: '/chat/:tenantId/:agentId',
    element: withSuspense(<PublicChatPage />),
  },
  {
    path: '/book/:tenantId/:agentId',
    element: withSuspense(<PublicChatPage />),
  },
  {
    path: '/superadmin/login',
    element: withSuspense(<SuperAdminLoginPage />),
  },
  {
    path: '/superadmin',
    element: <SuperAdminProtectedRoute />,
    children: [
      {
        element: withSuspense(<AdminLayout />),
        children: [
          {
            index: true,
            element: <Navigate to="/superadmin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: withSuspense(<SuperAdminDashboard />),
          },
          {
            path: 'tenants',
            element: withSuspense(<TenantListPage />),
          },
          {
            path: 'rate-limits',
            element: withSuspense(<RateLimitsPage />),
          },
          {
            path: 'system-health',
            element: withSuspense(<SystemHealthPage />),
          },
          {
            path: 'settings',
            element: withSuspense(<GlobalSettingsPage />),
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
        element: ownerRoute(<TenantAgentsPage />),
      },
      {
        path: 'landingboard',
        element: ownerRoute(<SchedulingOnboarding />),
      },
      {
        path: 'agent-setup/:id',
        element: ownerRoute(<AgentOnboardingWizard />),
      },
      {
        element: withSuspense(<TenantLayout />),
        children: [
          // Owner Only Routes
          {
            path: 'dashboard',
            element: ownerRoute(<TenantDashboardPage />),
          },
          {
            path: 'agents/:agentId/dashboard',
            element: ownerRoute(<TenantDashboardPage />),
          },
          {
            path: 'billing',
            element: ownerRoute(<BillingPage />),
          },
          {
            path: 'agents/:agentId/billing',
            element: ownerRoute(<BillingPage />),
          },
          {
            path: 'users',
            element: ownerRoute(<WorkspaceUsersPage />),
          },
          {
            path: 'agents/:agentId/users',
            element: ownerRoute(<WorkspaceUsersPage />),
          },
          {
            path: 'agents/:agentId/knowledge',
            element: ownerRoute(<KnowledgeBasePage />),
          },
          {
            path: 'knowledge',
            element: ownerRoute(<KnowledgeBasePage />),
          },
          {
            path: 'agents/:agentId/settings',
            element: ownerRoute(<ScheduleSettingsPage />),
          },
          {
            path: 'settings',
            element: ownerRoute(<ScheduleSettingsPage />),
          },
          {
            path: 'agents/:agentId/widget',
            element: ownerRoute(<EmbedWidgetPage />),
          },
          {
            path: 'widget',
            element: ownerRoute(<EmbedWidgetPage />),
          },

          // Shared Operational Routes (Both Owner and Manager)
          {
            path: 'bookings',
            element: withSuspense(<BookingsPage />),
          },
          {
            path: 'agents/:agentId/bookings',
            element: withSuspense(<BookingsPage />),
          },
          {
            path: 'customers',
            element: withSuspense(<CustomersPage />),
          },
          {
            path: 'agents/:agentId/customers',
            element: withSuspense(<CustomersPage />),
          },
          {
            path: 'services',
            element: withSuspense(<ServicesListPage />),
          },
          {
            path: 'services/new',
            element: withSuspense(<ServiceEditorPage mode="create" />),
          },
          {
            path: 'services/:id',
            element: withSuspense(<ServiceEditorPage mode="edit" />),
          },
          {
            path: 'agents/:agentId/services',
            element: withSuspense(<ServicesListPage />),
          },
          {
            path: 'agents/:agentId/services/new',
            element: withSuspense(<ServiceEditorPage mode="create" />),
          },
          {
            path: 'agents/:agentId/services/:id',
            element: withSuspense(<ServiceEditorPage mode="edit" />),
          },
          {
            path: 'inventory',
            element: withSuspense(<ResourcesListPage />),
          },
          {
            path: 'inventory/new',
            element: withSuspense(<ResourceEditorPage mode="create" />),
          },
          {
            path: 'inventory/:id',
            element: withSuspense(<ResourceEditorPage mode="edit" />),
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
            element: withSuspense(<ResourcesListPage />),
          },
          {
            path: 'agents/:agentId/resources/new',
            element: withSuspense(<ResourceEditorPage mode="create" />),
          },
          {
            path: 'agents/:agentId/resources/:id',
            element: withSuspense(<ResourceEditorPage mode="edit" />),
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
    element: withSuspense(<AcceptInvitePage />),
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
          <Suspense fallback={<PageLoader />}>
            <RouterProvider router={router} />
          </Suspense>
          <Toaster position="top-right" richColors closeButton visibleToasts={5} />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </>,
  );
}
