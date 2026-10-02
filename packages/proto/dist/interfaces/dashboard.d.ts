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
    login(request: DashboardUserLoginRequest): Observable<DashboardUserLoginResponse>;
}
export interface DashboardAuthServiceController {
    login(request: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse> | Observable<DashboardUserLoginResponse> | DashboardUserLoginResponse;
}
export declare function DashboardAuthServiceControllerMethods(): (constructor: Function) => void;
export declare const DASHBOARD_AUTH_SERVICE_NAME = "DashboardAuthService";
export interface DashboardUserServiceClient {
    inviteUser(request: InviteUserRequest): Observable<InviteUserResponse>;
    listWorkspaceUsers(request: ListWorkspaceUsersRequest): Observable<ListWorkspaceUsersResponse>;
}
export interface DashboardUserServiceController {
    inviteUser(request: InviteUserRequest): Promise<InviteUserResponse> | Observable<InviteUserResponse> | InviteUserResponse;
    listWorkspaceUsers(request: ListWorkspaceUsersRequest): Promise<ListWorkspaceUsersResponse> | Observable<ListWorkspaceUsersResponse> | ListWorkspaceUsersResponse;
}
export declare function DashboardUserServiceControllerMethods(): (constructor: Function) => void;
export declare const DASHBOARD_USER_SERVICE_NAME = "DashboardUserService";
//# sourceMappingURL=dashboard.d.ts.map