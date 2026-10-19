import {
  TenantGetProfileResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "@repo/proto/tenant";
import {
  InviteUserResponse,
  ListWorkspaceUsersResponse,
} from "@repo/proto/dashboard";

export interface TenantAuthResult {
  tenant: {
    tenant_id: string;
    business_name: string;
    contact_email: string;
    tier: string;
    status: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  tenant_id: string;
  message: string;
  verification_token: string;
}

export interface VerifyEmailResult {
  message: string;
  tenant_id: string;
}

export interface TokenRotationResult {
  accessToken: string;
  refreshToken: string;
}

export interface ITenantService {
  register(data: {
    business_name: string;
    full_name: string;
    email: string;
    password: string;
  }): Promise<RegisterResult>;

  verifyEmail(token: string): Promise<VerifyEmailResult>;

  login(email: string, password: string): Promise<TenantAuthResult>;

  googleLogin(idToken: string): Promise<TenantAuthResult>;

  getProfile(tenantId: string): Promise<TenantGetProfileResponse>;

  refreshToken(incomingRefreshToken: string): Promise<TokenRotationResult>;

  logout(refreshToken?: string): Promise<{ message: string; }>;

  forgotPassword(email: string): Promise<ForgotPasswordResponse>;

  resetPassword(token: string, new_password: string): Promise<ResetPasswordResponse>;

  inviteUser(data: {
    tenant_id: string;
    email: string;
    name: string;
    system_role: 'root' | 'manager';
  }): Promise<InviteUserResponse>;

  listWorkspaceUsers(options: {
    tenant_id: string;
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<ListWorkspaceUsersResponse>;
}
