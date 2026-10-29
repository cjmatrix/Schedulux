export const GRPC_SERVICES = {
  TENANT_AUTH: 'TenantAuthService',
  TENANT: 'TenantService',
  SUPERADMIN_AUTH: 'SuperAdminAuthService',
  DASHBOARD_AUTH: 'DashboardAuthService',
  DASHBOARD_USER: 'DashboardUserService',
} as const;

export const GRPC_METHODS = {
  TENANT_AUTH: {
    REGISTER: 'Register',
    VERIFY_EMAIL: 'VerifyEmail',
    LOGIN: 'Login',
    GOOGLE_LOGIN: 'GoogleLogin',
    REFRESH_TOKEN: 'RefreshToken',
    GET_PROFILE: 'GetProfile',
    LOGOUT: 'Logout',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
  },
  SUPERADMIN_AUTH: {
    LOGIN: 'Login',
    REFRESH_TOKEN: 'RefreshToken',
    LOGOUT: 'Logout',
    GET_PROFILE: 'GetProfile',
  },
  TENANT: {
    LIST_TENANTS: 'ListTenants',
    SUSPEND_TENANT: 'SuspendTenant',
  },
  DASHBOARD_AUTH: {
    LOGIN: 'Login',
    GET_PROFILE: 'GetProfile',
    REFRESH_TOKEN: 'RefreshToken',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
  },
  DASHBOARD_USER: {
    INVITE_USER: 'InviteUser',
    LIST_WORKSPACE_USERS: 'ListWorkspaceUsers',
  },
} as const;
