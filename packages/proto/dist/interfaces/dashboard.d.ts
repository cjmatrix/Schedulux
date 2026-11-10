import type { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
export declare const protobufPackage = "dashboard";
export interface DashboardUserLoginRequest {
    email: string;
    password: string;
}
export interface DashboardUserLoginResponse {
    message: string;
    user: WorkspaceUserInfo | undefined;
    access_token: string;
    refresh_token: string;
}
export interface DashboardUserProfileRequest {
    user_id: string;
}
export interface DashboardUserProfileResponse {
    user: WorkspaceUserInfo | undefined;
}
export interface DashboardUserRefreshTokenRequest {
    refresh_token: string;
}
export interface DashboardUserRefreshTokenResponse {
    message: string;
    access_token: string;
    refresh_token: string;
}
export interface DashboardUserForgotPasswordRequest {
    email: string;
}
export interface DashboardUserForgotPasswordResponse {
    message: string;
}
export interface DashboardUserResetPasswordRequest {
    token: string;
    new_password: string;
}
export interface DashboardUserResetPasswordResponse {
    message: string;
}
export interface InviteUserRequest {
    tenant_id: string;
    email: string;
    name: string;
    system_role: string;
}
export interface InviteUserResponse {
    message: string;
    user_id: string;
    email: string;
    name: string;
    system_role: string;
}
export interface WorkspaceUserInfo {
    user_id: string;
    tenant_id: string;
    email: string;
    name: string;
    system_role: string;
    created_at: string;
}
export interface ListWorkspaceUsersRequest {
    tenant_id: string;
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    role?: string | undefined;
}
export interface ListWorkspaceUsersResponse {
    users: WorkspaceUserInfo[];
    total_count: number;
}
export declare const DASHBOARD_PACKAGE_NAME = "dashboard";
export interface DashboardAuthServiceClient {
    login(request: DashboardUserLoginRequest, metadata?: Metadata): Observable<DashboardUserLoginResponse>;
    getProfile(request: DashboardUserProfileRequest, metadata?: Metadata): Observable<DashboardUserProfileResponse>;
    refreshToken(request: DashboardUserRefreshTokenRequest, metadata?: Metadata): Observable<DashboardUserRefreshTokenResponse>;
    forgotPassword(request: DashboardUserForgotPasswordRequest, metadata?: Metadata): Observable<DashboardUserForgotPasswordResponse>;
    resetPassword(request: DashboardUserResetPasswordRequest, metadata?: Metadata): Observable<DashboardUserResetPasswordResponse>;
}
export interface DashboardAuthServiceController {
    login(request: DashboardUserLoginRequest, metadata?: Metadata): Promise<DashboardUserLoginResponse> | Observable<DashboardUserLoginResponse> | DashboardUserLoginResponse;
    getProfile(request: DashboardUserProfileRequest, metadata?: Metadata): Promise<DashboardUserProfileResponse> | Observable<DashboardUserProfileResponse> | DashboardUserProfileResponse;
    refreshToken(request: DashboardUserRefreshTokenRequest, metadata?: Metadata): Promise<DashboardUserRefreshTokenResponse> | Observable<DashboardUserRefreshTokenResponse> | DashboardUserRefreshTokenResponse;
    forgotPassword(request: DashboardUserForgotPasswordRequest, metadata?: Metadata): Promise<DashboardUserForgotPasswordResponse> | Observable<DashboardUserForgotPasswordResponse> | DashboardUserForgotPasswordResponse;
    resetPassword(request: DashboardUserResetPasswordRequest, metadata?: Metadata): Promise<DashboardUserResetPasswordResponse> | Observable<DashboardUserResetPasswordResponse> | DashboardUserResetPasswordResponse;
}
export declare function DashboardAuthServiceControllerMethods(): (constructor: Function) => void;
export declare const DASHBOARD_AUTH_SERVICE_NAME = "DashboardAuthService";
export interface DashboardUserServiceClient {
    inviteUser(request: InviteUserRequest, metadata?: Metadata): Observable<InviteUserResponse>;
    listWorkspaceUsers(request: ListWorkspaceUsersRequest, metadata?: Metadata): Observable<ListWorkspaceUsersResponse>;
}
export interface DashboardUserServiceController {
    inviteUser(request: InviteUserRequest, metadata?: Metadata): Promise<InviteUserResponse> | Observable<InviteUserResponse> | InviteUserResponse;
    listWorkspaceUsers(request: ListWorkspaceUsersRequest, metadata?: Metadata): Promise<ListWorkspaceUsersResponse> | Observable<ListWorkspaceUsersResponse> | ListWorkspaceUsersResponse;
}
export declare function DashboardUserServiceControllerMethods(): (constructor: Function) => void;
export declare const DASHBOARD_USER_SERVICE_NAME = "DashboardUserService";
//# sourceMappingURL=dashboard.d.ts.map