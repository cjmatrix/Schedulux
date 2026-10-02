import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import "./index.css";
import App from "./App.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import DashboardUserLoginPage from "./pages/DashboardUserLoginPage.tsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.tsx";

// Superadmin Feature Imports
import SuperAdminLoginPage from "./features/superadmin/pages/SuperAdminLoginPage.tsx";
import AdminLayout from "./features/superadmin/components/AdminLayout.tsx";
import SuperAdminDashboard from "./features/superadmin/pages/SuperAdminDashboard.tsx";
import TenantListPage from "./features/superadmin/pages/TenantListPage.tsx";
import SystemHealthPage from "./features/superadmin/pages/SystemHealthPage.tsx";
import GlobalSettingsPage from "./features/superadmin/pages/GlobalSettingsPage.tsx";

// Tenant Dashboard Feature Imports
import TenantLayout from "./features/tenant/pages/layout/TenantLayout.tsx";
import WorkspaceUsersPage from "./features/tenant/pages/WorkspaceUsersPage.tsx";

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
    path: "/dashboard/login",
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
    path: "/superadmin/login",
    element: <SuperAdminLoginPage />,
  },
  {
    path: "/superadmin",
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
  {
    path: "/tenant",
    element: <TenantLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/tenant/users" replace />,
      },
      {
        path: "dashboard",
        element: <Navigate to="/tenant/users" replace />,
      },
      {
        path: "users",
        element: <WorkspaceUsersPage />,
      },
    ],
  },
  {
    path: "/workspace/users",
    element: <Navigate to="/tenant/users" replace />,
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
