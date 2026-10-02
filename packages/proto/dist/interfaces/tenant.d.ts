import { Observable } from "rxjs";
export declare const protobufPackage = "tenant";
export interface TenantGoogleLoginRequest {
    id_token: string;
}
export interface RegisterRequest {
    business_name: string;
    full_name: string;
    email: string;
    password: string;
}
export interface RegisterResponse {
    tenant_id: string;
    message: string;
    verification_token: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface TenantInfo {
    tenant_id: string;
    business_name: string;
    contact_email: string;
    tier: string;
    status: string;
}
export interface ListTenantsRequest {
    page: number;
    limit: number;
    search?: string | undefined;
    tier?: string | undefined;
    status?: string | undefined;
}
export interface ListTenantsResponse {
    tenants: TenantInfo[];
    total_count: number;
}
export interface SuspendTenantRequest {
    tenant_id: string;
}
export interface SuspendTenantResponse {
    message: string;
    tenant: TenantInfo | undefined;
}
export interface LoginResponse {
    message: string;
    tenant: TenantInfo | undefined;
    access_token: string;
    refresh_token: string;
}
export interface VerifyEmailRequest {
    token: string;
}
export interface VerifyEmailResponse {
    message: string;
    tenant_id: string;
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
export declare const TENANT_PACKAGE_NAME = "tenant";
export interface TenantAuthServiceClient {
    register(request: RegisterRequest): Observable<RegisterResponse>;
    login(request: LoginRequest): Observable<LoginResponse>;
    googleLogin(request: TenantGoogleLoginRequest): Observable<LoginResponse>;
    verifyEmail(request: VerifyEmailRequest): Observable<VerifyEmailResponse>;
    logout(request: LogoutRequest): Observable<LogoutResponse>;
    refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse>;
}
export interface TenantAuthServiceController {
    register(request: RegisterRequest): Promise<RegisterResponse> | Observable<RegisterResponse> | RegisterResponse;
    login(request: LoginRequest): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse;
    googleLogin(request: TenantGoogleLoginRequest): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse;
    verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> | Observable<VerifyEmailResponse> | VerifyEmailResponse;
    logout(request: LogoutRequest): Promise<LogoutResponse> | Observable<LogoutResponse> | LogoutResponse;
    refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> | Observable<RefreshTokenResponse> | RefreshTokenResponse;
}
export declare function TenantAuthServiceControllerMethods(): (constructor: Function) => void;
export declare const TENANT_AUTH_SERVICE_NAME = "TenantAuthService";
export interface TenantServiceClient {
    listTenants(request: ListTenantsRequest): Observable<ListTenantsResponse>;
    suspendTenant(request: SuspendTenantRequest): Observable<SuspendTenantResponse>;
}
export interface TenantServiceController {
    listTenants(request: ListTenantsRequest): Promise<ListTenantsResponse> | Observable<ListTenantsResponse> | ListTenantsResponse;
    suspendTenant(request: SuspendTenantRequest): Promise<SuspendTenantResponse> | Observable<SuspendTenantResponse> | SuspendTenantResponse;
}
export declare function TenantServiceControllerMethods(): (constructor: Function) => void;
export declare const TENANT_SERVICE_NAME = "TenantService";
//# sourceMappingURL=tenant.d.ts.map