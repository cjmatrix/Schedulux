import { Observable } from "rxjs";
export declare const protobufPackage = "scheduling";
export interface PriceInfo {
    type: string;
    amount: number;
    currency: string;
}
export interface DepositInfo {
    required: boolean;
    amount: number;
    processor: string;
    upi_id: string;
    qr_code_url: string;
    confirmation_method: string;
    payment_instructions: string;
}
export interface ServiceVerificationInfo {
    require_otp?: boolean | undefined;
}
export interface ServiceInfo {
    service_id: string;
    tenant_id: string;
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    allocation_model: string;
    price: PriceInfo | undefined;
    deposit: DepositInfo | undefined;
    eligible_resource_ids: string[];
    required_asset_ids: string[];
    recall_interval_days: number;
    created_at: string;
    updated_at: string;
    booking_mode: string;
    agent_id: string;
    verification?: ServiceVerificationInfo | undefined;
}
export interface CreateServiceRequest {
    tenant_id: string;
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    allocation_model: string;
    price: PriceInfo | undefined;
    deposit: DepositInfo | undefined;
    eligible_resource_ids: string[];
    required_asset_ids: string[];
    recall_interval_days: number;
    booking_mode?: string | undefined;
    agent_id?: string | undefined;
    service_id?: string | undefined;
    verification?: ServiceVerificationInfo | undefined;
}
export interface GetServiceRequest {
    tenant_id: string;
    service_id: string;
}
export interface ListServicesRequest {
    tenant_id: string;
    page: number;
    limit: number;
    category: string;
    agent_id?: string | undefined;
    search?: string | undefined;
}
export interface ServiceSummaryInfo {
    total_count: number;
    avg_price: number;
    deposit_count: number;
    categories: string[];
}
export interface ListServicesResponse {
    services: ServiceInfo[];
    total: number;
    page: number;
    limit: number;
    summary?: ServiceSummaryInfo | undefined;
}
export interface UpdateServiceRequest {
    tenant_id: string;
    service_id: string;
    name?: string | undefined;
    category?: string | undefined;
    description?: string | undefined;
    duration_minutes?: number | undefined;
    buffer_minutes?: number | undefined;
    allocation_model?: string | undefined;
    price: PriceInfo | undefined;
    deposit: DepositInfo | undefined;
    eligible_resource_ids: string[];
    required_asset_ids: string[];
    recall_interval_days?: number | undefined;
    booking_mode?: string | undefined;
    agent_id?: string | undefined;
    verification?: ServiceVerificationInfo | undefined;
}
export interface DeleteServiceRequest {
    tenant_id: string;
    service_id: string;
}
export interface DeleteServiceResponse {
    success: boolean;
    message: string;
}
export interface ServiceResponse {
    service: ServiceInfo | undefined;
    message: string;
}
export interface ResourceInfo {
    resource_id: string;
    tenant_id: string;
    resource_type: string;
    name: string;
    title: string;
    category: string;
    description: string;
    is_bookable: boolean;
    dispatch_status: string;
    custom_shift_overrides_json: string;
    created_at: string;
    updated_at: string;
    agent_id: string;
}
export interface CreateResourceRequest {
    tenant_id: string;
    resource_type: string;
    name: string;
    title: string;
    category: string;
    description: string;
    is_bookable: boolean;
    dispatch_status: string;
    custom_shift_overrides_json: string;
    agent_id?: string | undefined;
    resource_id?: string | undefined;
}
export interface GetResourceRequest {
    tenant_id: string;
    resource_id: string;
}
export interface ListResourcesRequest {
    tenant_id: string;
    page: number;
    limit: number;
    resource_type: string;
    dispatch_status: string;
    agent_id?: string | undefined;
    search?: string | undefined;
    category?: string | undefined;
}
export interface ResourceSummaryInfo {
    total_count: number;
    active_count: number;
    staff_count: number;
    physical_count: number;
}
export interface ListResourcesResponse {
    resources: ResourceInfo[];
    total: number;
    page: number;
    limit: number;
    summary?: ResourceSummaryInfo | undefined;
}
export interface UpdateResourceRequest {
    tenant_id: string;
    resource_id: string;
    resource_type?: string | undefined;
    name?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    description?: string | undefined;
    is_bookable?: boolean | undefined;
    dispatch_status?: string | undefined;
    custom_shift_overrides_json?: string | undefined;
    agent_id?: string | undefined;
}
export interface DeleteResourceRequest {
    tenant_id: string;
    resource_id: string;
}
export interface DeleteResourceResponse {
    success: boolean;
    message: string;
}
export interface ResourceResponse {
    resource: ResourceInfo | undefined;
    message: string;
}
export interface BatchSyncInventoryRequest {
    tenant_id: string;
    agent_id: string;
    resources: CreateResourceRequest[];
    services: CreateServiceRequest[];
}
export interface BatchSyncInventoryResponse {
    resources: ResourceInfo[];
    services: ServiceInfo[];
    success: boolean;
    message: string;
}
export declare const SCHEDULING_PACKAGE_NAME = "scheduling";
export interface SchedulingInventoryServiceClient {
    /** Service CRUD */
    createService(request: CreateServiceRequest): Observable<ServiceResponse>;
    getService(request: GetServiceRequest): Observable<ServiceResponse>;
    listServices(request: ListServicesRequest): Observable<ListServicesResponse>;
    updateService(request: UpdateServiceRequest): Observable<ServiceResponse>;
    deleteService(request: DeleteServiceRequest): Observable<DeleteServiceResponse>;
    /** Resource CRUD */
    createResource(request: CreateResourceRequest): Observable<ResourceResponse>;
    getResource(request: GetResourceRequest): Observable<ResourceResponse>;
    listResources(request: ListResourcesRequest): Observable<ListResourcesResponse>;
    updateResource(request: UpdateResourceRequest): Observable<ResourceResponse>;
    deleteResource(request: DeleteResourceRequest): Observable<DeleteResourceResponse>;
    /** Batch / Bulk Operations */
    batchSyncInventory(request: BatchSyncInventoryRequest): Observable<BatchSyncInventoryResponse>;
}
export interface SchedulingInventoryServiceController {
    /** Service CRUD */
    createService(request: CreateServiceRequest): Promise<ServiceResponse> | Observable<ServiceResponse> | ServiceResponse;
    getService(request: GetServiceRequest): Promise<ServiceResponse> | Observable<ServiceResponse> | ServiceResponse;
    listServices(request: ListServicesRequest): Promise<ListServicesResponse> | Observable<ListServicesResponse> | ListServicesResponse;
    updateService(request: UpdateServiceRequest): Promise<ServiceResponse> | Observable<ServiceResponse> | ServiceResponse;
    deleteService(request: DeleteServiceRequest): Promise<DeleteServiceResponse> | Observable<DeleteServiceResponse> | DeleteServiceResponse;
    /** Resource CRUD */
    createResource(request: CreateResourceRequest): Promise<ResourceResponse> | Observable<ResourceResponse> | ResourceResponse;
    getResource(request: GetResourceRequest): Promise<ResourceResponse> | Observable<ResourceResponse> | ResourceResponse;
    listResources(request: ListResourcesRequest): Promise<ListResourcesResponse> | Observable<ListResourcesResponse> | ListResourcesResponse;
    updateResource(request: UpdateResourceRequest): Promise<ResourceResponse> | Observable<ResourceResponse> | ResourceResponse;
    deleteResource(request: DeleteResourceRequest): Promise<DeleteResourceResponse> | Observable<DeleteResourceResponse> | DeleteResourceResponse;
    /** Batch / Bulk Operations */
    batchSyncInventory(request: BatchSyncInventoryRequest): Promise<BatchSyncInventoryResponse> | Observable<BatchSyncInventoryResponse> | BatchSyncInventoryResponse;
}
export declare function SchedulingInventoryServiceControllerMethods(): (constructor: Function) => void;
export declare const SCHEDULING_INVENTORY_SERVICE_NAME = "SchedulingInventoryService";
//# sourceMappingURL=scheduling.d.ts.map