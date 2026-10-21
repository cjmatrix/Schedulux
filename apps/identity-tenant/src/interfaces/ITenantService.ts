import {
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersRequest,
  ListWorkspaceUsersResponse,
} from '@repo/proto/dashboard';
import {
  ForgotPasswordResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordResponse,
  TenantGetProfileResponse,
  TenantInfo,
  VerifyEmailResponse,
} from '@repo/proto/tenant';

export interface TenantAuthResult {
  tenant: TenantInfo;
  accessToken: string;
  refreshToken: string;
}

export type RegisterResult = RegisterResponse;

export type VerifyEmailResult = VerifyEmailResponse;

export interface TokenRotationResult {
  accessToken: string;
  refreshToken: string;
}

export interface ITenantService {
  register(data: RegisterRequest): Promise<RegisterResponse>;

  verifyEmail(token: string): Promise<VerifyEmailResponse>;

  login(email: string, password: string): Promise<TenantAuthResult>;

  googleLogin(idToken: string): Promise<TenantAuthResult>;

  getProfile(tenantId: string): Promise<TenantGetProfileResponse>;

  refreshToken(incomingRefreshToken: string): Promise<TokenRotationResult>;

  logout(refreshToken?: string): Promise<{ message: string }>;

  forgotPassword(email: string): Promise<ForgotPasswordResponse>;

  resetPassword(token: string, new_password: string): Promise<ResetPasswordResponse>;

  inviteUser(data: InviteUserRequest): Promise<InviteUserResponse>;

  listWorkspaceUsers(options: ListWorkspaceUsersRequest): Promise<ListWorkspaceUsersResponse>;
}
