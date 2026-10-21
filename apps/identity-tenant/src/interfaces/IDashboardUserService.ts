import {
  DashboardUserForgotPasswordResponse,
  DashboardUserLoginRequest,
  DashboardUserLoginResponse,
  DashboardUserProfileRequest,
  DashboardUserProfileResponse,
  DashboardUserRefreshTokenRequest,
  DashboardUserRefreshTokenResponse,
  DashboardUserResetPasswordResponse,
} from '@repo/proto/dashboard';

export interface IDashboardUserService {
  login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse>;

  getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse>;

  refreshToken(data: DashboardUserRefreshTokenRequest): Promise<DashboardUserRefreshTokenResponse>;

  forgotPassword(email: string): Promise<DashboardUserForgotPasswordResponse>;

  resetPassword(token: string, new_password: string): Promise<DashboardUserResetPasswordResponse>;
}
