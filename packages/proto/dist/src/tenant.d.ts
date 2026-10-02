import { Observable } from "rxjs";
export declare const protobufPackage = "tenant";
export interface RegisterRequest {
    businessName: string;
    fullName: string;
    email: string;
    password: string;
}
export interface RegisterResponse {
    tenantId: string;
    message: string;
    verificationToken: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface TenantInfo {
    tenantId: string;
    businessName: string;
    contactEmail: string;
    tier: string;
    status: string;
}
export interface LoginResponse {
    message: string;
    tenant: TenantInfo | undefined;
    accessToken: string;
    refreshToken: string;
}
export interface VerifyEmailRequest {
    token: string;
}
export interface VerifyEmailResponse {
    message: string;
    tenantId: string;
}
export interface LogoutRequest {
    refreshToken: string;
}
export interface LogoutResponse {
    message: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
}
export declare const TENANT_PACKAGE_NAME = "tenant";
export interface TenantAuthServiceClient {
    register(request: RegisterRequest): Observable<RegisterResponse>;
    login(request: LoginRequest): Observable<LoginResponse>;
    verifyEmail(request: VerifyEmailRequest): Observable<VerifyEmailResponse>;
    logout(request: LogoutRequest): Observable<LogoutResponse>;
    refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse>;
}
export interface TenantAuthServiceController {
    register(request: RegisterRequest): Promise<RegisterResponse> | Observable<RegisterResponse> | RegisterResponse;
    login(request: LoginRequest): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse;
    verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> | Observable<VerifyEmailResponse> | VerifyEmailResponse;
    logout(request: LogoutRequest): Promise<LogoutResponse> | Observable<LogoutResponse> | LogoutResponse;
    refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> | Observable<RefreshTokenResponse> | RefreshTokenResponse;
}
export declare function TenantAuthServiceControllerMethods(): (constructor: Function) => void;
export declare const TENANT_AUTH_SERVICE_NAME = "TenantAuthService";
//# sourceMappingURL=tenant.d.ts.map