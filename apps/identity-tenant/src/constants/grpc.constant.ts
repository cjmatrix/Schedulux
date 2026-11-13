export const GRPC_SERVICES = {
  TENANT_AUTH: 'TenantAuthService',
  TENANT: 'TenantService',
  SUPERADMIN_AUTH: 'SuperAdminAuthService',
  SUPERADMIN_DASHBOARD: 'SuperAdminDashboardService',
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
  SUPERADMIN_DASHBOARD: {
    GET_OVERVIEW: 'GetSuperAdminOverview',
    GET_REVENUE_CHART: 'GetRevenueChart',
  },
  TENANT: {
    LIST_TENANTS: 'ListTenants',
    SUSPEND_TENANT: 'SuspendTenant',
    UPDATE_SUBSCRIPTION: 'UpdateTenantSubscription',
    GET_BILLING_INFO: 'GetTenantBillingInfo',
    PROCESS_PADDLE_WEBHOOK: 'ProcessPaddleWebhook',
    CREATE_PADDLE_CHECKOUT: 'CreatePaddleCheckout',
  },
  DASHBOARD_AUTH: {
    LOGIN: 'Login',
    GET_PROFILE: 'GetProfile',
    REFRESH_TOKEN: 'RefreshToken',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
    ACCEPT_INVITATION: 'AcceptInvitation',
    GET_INVITATION_DETAILS: 'GetInvitationDetails',
  },
  DASHBOARD_USER: {
    INVITE_USER: 'InviteUser',
    LIST_WORKSPACE_USERS: 'ListWorkspaceUsers',
  },
} as const;
