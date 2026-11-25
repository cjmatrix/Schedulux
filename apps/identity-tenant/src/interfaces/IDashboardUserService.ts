import {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  DashboardUserForgotPasswordResponse,
  DashboardUserLoginRequest,
  DashboardUserLoginResponse,
  DashboardUserProfileRequest,
  DashboardUserProfileResponse,
  DashboardUserRefreshTokenRequest,
  DashboardUserRefreshTokenResponse,
  DashboardUserResetPasswordResponse,
  GetInvitationDetailsResponse,
} from '@repo/proto/dashboard';

export interface IDashboardUserService {
  login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse>;

  getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse>;

  refreshToken(data: DashboardUserRefreshTokenRequest): Promise<DashboardUserRefreshTokenResponse>;

  forgotPassword(email: string): Promise<DashboardUserForgotPasswordResponse>;

  resetPassword(token: string, new_password: string): Promise<DashboardUserResetPasswordResponse>;

  acceptInvitation(data: AcceptInvitationRequest): Promise<AcceptInvitationResponse>;

  getInvitationDetails(token: string): Promise<GetInvitationDetailsResponse>;
}
