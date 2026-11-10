import type { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
export declare const protobufPackage = "superadmin";
export interface LoginRequest {
    email: string;
    password: string;
}
export interface SuperAdminInfo {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
}
export interface LoginResponse {
    message: string;
    superAdmin: SuperAdminInfo | undefined;
    access_token: string;
    refresh_token: string;
}
export interface LogoutRequest {
    refresh_token: string;
}
export interface LogoutResponse {
    message: string;
}
export interface RefreshTokenRequest {
    refresh_token: string;
}
export interface RefreshTokenResponse {
    message: string;
    access_token: string;
    refresh_token: string;
}
export interface GetProfileRequest {
    superadmin_id: string;
}
export interface GetProfileResponse {
    superAdmin: SuperAdminInfo | undefined;
}
export declare const SUPERADMIN_PACKAGE_NAME = "superadmin";
export interface SuperAdminAuthServiceClient {
    login(request: LoginRequest, metadata?: Metadata): Observable<LoginResponse>;
    logout(request: LogoutRequest, metadata?: Metadata): Observable<LogoutResponse>;
    refreshToken(request: RefreshTokenRequest, metadata?: Metadata): Observable<RefreshTokenResponse>;
    getProfile(request: GetProfileRequest, metadata?: Metadata): Observable<GetProfileResponse>;
}
export interface SuperAdminAuthServiceController {
    login(request: LoginRequest, metadata?: Metadata): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse;
    logout(request: LogoutRequest, metadata?: Metadata): Promise<LogoutResponse> | Observable<LogoutResponse> | LogoutResponse;
    refreshToken(request: RefreshTokenRequest, metadata?: Metadata): Promise<RefreshTokenResponse> | Observable<RefreshTokenResponse> | RefreshTokenResponse;
    getProfile(request: GetProfileRequest, metadata?: Metadata): Promise<GetProfileResponse> | Observable<GetProfileResponse> | GetProfileResponse;
}
export declare function SuperAdminAuthServiceControllerMethods(): (constructor: Function) => void;
export declare const SUPER_ADMIN_AUTH_SERVICE_NAME = "SuperAdminAuthService";
//# sourceMappingURL=superadmin.d.ts.map