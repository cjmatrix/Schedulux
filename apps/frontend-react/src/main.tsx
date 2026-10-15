import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import "./index.css";
import App from "./App.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import RegisterPage from "./features/tenant/pages/RegisterPage.tsx";
import LoginPage from "./features/tenant/pages/LoginPage.tsx";
import DashboardUserLoginPage from "./features/dashboard-user/DashboardUserLoginPage.tsx";
import VerifyEmailPage from "./features/tenant/pages/VerifyEmailPage.tsx";
import ForgotPasswordPage from "./features/tenant/pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./features/tenant/pages/ResetPasswordPage.tsx";

// Superadmin Feature Imports
import SuperAdminLoginPage from "./features/superadmin/pages/SuperAdminLoginPage.tsx";
import AdminLayout from "./features/superadmin/components/AdminLayout.tsx";
import SuperAdminDashboard from "./features/superadmin/pages/SuperAdminDashboard.tsx";
import TenantListPage from "./features/superadmin/pages/TenantListPage.tsx";
import SystemHealthPage from "./features/superadmin/pages/SystemHealthPage.tsx";
import GlobalSettingsPage from "./features/superadmin/pages/GlobalSettingsPage.tsx";
import { SuperAdminProtectedRoute } from "./features/superadmin/components/SuperAdminProtectedRoute.tsx";

// Tenant Dashboard Feature Imports
import TenantLayout from "./features/tenant/pages/layout/TenantLayout.tsx";
import WorkspaceUsersPage from "./features/tenant/pages/WorkspaceUsersPage.tsx";
import BookingsPage from "./features/tenant/pages/BookingsPage.tsx";
import TenantAgentsPage from "./features/tenant/pages/TenantAgentsPage.tsx";
import ServicesListPage from "./features/tenant/pages/ServicesListPage.tsx";
import ServiceEditorPage from "./features/tenant/pages/ServiceEditorPage.tsx";
import ResourcesListPage from "./features/tenant/pages/ResourcesListPage.tsx";
import ResourceEditorPage from "./features/tenant/pages/ResourceEditorPage.tsx";
import { TenantProtectedRoute } from "./features/tenant/components/TenantProtectedRoute.tsx";
import { DashboardUserProtectedRoute } from "./features/dashboard-user/components/DashboardUserProtectedRoute.tsx";
import SchedulingOnboarding from "./pages/SchedulingOnboarding.tsx";
import AgentOnboardingWizard from "./pages/AgentOnboardingWizard.tsx";
import AgentDashboardPage from "./features/tenant/pages/AgentDashboardPage.tsx";

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
    path: "/",
    element: <App />,
  },
  {
    path: "/home",
    element: <LandingPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboarduser/login",
    element: <DashboardUserLoginPage />,
  },
  {
    path: "/tenant/user-login",
    element: <DashboardUserLoginPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/dashboarduser/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/superadmin/login",
    element: <SuperAdminLoginPage />,
  },
  {
    path: "/superadmin",
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
            path: "dashboard",
            element: <SuperAdminDashboard />,
          },
          {
            path: "tenants",
            element: <TenantListPage />,
          },
          {
            path: "system-health",
            element: <SystemHealthPage />,
          },
          {
            path: "settings",
            element: <GlobalSettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/tenant",
    element: <TenantProtectedRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/tenant/agents" replace />,
      },
      {
        path: "dashboard",
        element: <Navigate to="/tenant/agents" replace />,
      },
      {
        path: "agents",
        element: <TenantAgentsPage />,
      },
      {
        path: "landingboard",
        element: <SchedulingOnboarding />,
      },
      {
        path: "agent-setup/:id",
        element: <AgentOnboardingWizard />,
      },
      {
        element: <TenantLayout isTenant={true} />,
        children: [
          {
            path: "users",
            element: <WorkspaceUsersPage />,
          },
          {
            path: "bookings",
            element: <BookingsPage />,
          },
       
          {
            path: "agents/:agentId/dashboard",
            element: <AgentDashboardPage />,
          },
          {
            path: "agents/:agentId/services",
            element: <ServicesListPage />,
          },
          {
            path: "agents/:agentId/services/new",
            element: <ServiceEditorPage mode="create" />,
          },
          {
            path: "agents/:agentId/services/:id",
            element: <ServiceEditorPage mode="edit" />,
          },
          {
            path: "agents/:agentId/resources",
            element: <ResourcesListPage />,
          },
          {
            path: "agents/:agentId/resources/new",
            element: <ResourceEditorPage mode="create" />,
          },
          {
            path: "agents/:agentId/resources/:id",
            element: <ResourceEditorPage mode="edit" />,
          },
       
          {
            path: "services",
            element: <ServicesListPage />,
          },
          {
            path: "services/new",
            element: <ServiceEditorPage mode="create" />,
          },
          {
            path: "services/:id",
            element: <ServiceEditorPage mode="edit" />,
          },
          {
            path: "inventory",
            element: <ResourcesListPage />,
          },
          {
            path: "inventory/new",
            element: <ResourceEditorPage mode="create" />,
          },
          {
            path: "inventory/:id",
            element: <ResourceEditorPage mode="edit" />,
          },
          {
            path: "resources",
            element: <Navigate to="/tenant/inventory" replace />,
          },
          {
            path: "resources/new",
            element: <Navigate to="/tenant/inventory/new" replace />,
          },
          {
            path: "resources/:id",
            element: <Navigate to="/tenant/inventory/:id" replace />,
          },
        ],
      },
    ],
  },
  {
    path: "/workspace/users",
    element: <Navigate to="/tenant/users" replace />,
  },
  {
    path: "/dashboarduser",
    element: <DashboardUserProtectedRoute />,
    children: [
      {
        path: "tenant",
        element: <TenantLayout isTenant={false} />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboarduser/tenant/bookings" replace />,
          },
          {
            path: "bookings",
            element: <BookingsPage />,
          },
        ],
      },
    ],
  },
]);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
