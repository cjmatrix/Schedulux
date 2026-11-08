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
export interface ResourceRequirementInfo {
    role: string;
    resource_type: string;
    count: number;
    eligible_resource_ids: string[];
    selection_mode?: string | undefined;
}
export interface ServiceInfo {
    service_id: string;
    tenant_id: string;
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    price: PriceInfo | undefined;
    deposit: DepositInfo | undefined;
    created_at: string;
    updated_at: string;
    booking_mode: string;
    agent_id: string;
    verification?: ServiceVerificationInfo | undefined;
    resource_requirements: ResourceRequirementInfo[];
    is_deleted?: boolean | undefined;
    deleted_at?: string | undefined;
}
export interface CreateServiceRequest {
    tenant_id: string;
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    price: PriceInfo | undefined;
    deposit: DepositInfo | undefined;
    booking_mode?: string | undefined;
    agent_id: string;
    service_id?: string | undefined;
    verification?: ServiceVerificationInfo | undefined;
    resource_requirements: ResourceRequirementInfo[];
    is_deleted?: boolean | undefined;
    deleted_at?: string | undefined;
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
    agent_id: string;
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
    price: PriceInfo | undefined;
    deposit: DepositInfo | undefined;
    booking_mode?: string | undefined;
    agent_id?: string | undefined;
    verification?: ServiceVerificationInfo | undefined;
    resource_requirements: ResourceRequirementInfo[];
    is_deleted?: boolean | undefined;
    deleted_at?: string | undefined;
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
    is_deleted?: boolean | undefined;
    deleted_at?: string | undefined;
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
    agent_id: string;
    resource_id?: string | undefined;
    is_deleted?: boolean | undefined;
    deleted_at?: string | undefined;
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
    agent_id: string;
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
    is_deleted?: boolean | undefined;
    deleted_at?: string | undefined;
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
export interface TimeIntervalInfo {
    start: string;
    end: string;
}
export interface OperatingHoursInfo {
    monday: TimeIntervalInfo[];
    tuesday: TimeIntervalInfo[];
    wednesday: TimeIntervalInfo[];
    thursday: TimeIntervalInfo[];
    friday: TimeIntervalInfo[];
    saturday: TimeIntervalInfo[];
    sunday: TimeIntervalInfo[];
}
export interface BlackoutDateInfo {
    date: string;
    reason?: string | undefined;
    is_closed: boolean;
}
export interface SchedulingEngineConfigInfo {
    booking_mode: string;
    default_lead_time_hours: number;
    max_advance_booking_days: number;
    cancellation_window_hours: number;
    hold_duration_minutes: number;
}
export interface VerificationPolicyConfigInfo {
    require_otp_for_new_booking: boolean;
}
export interface BatchSyncInventoryRequest {
    tenant_id: string;
    agent_id: string;
    resources: CreateResourceRequest[];
    services: CreateServiceRequest[];
    timezone?: string | undefined;
    currency?: string | undefined;
    operating_hours?: OperatingHoursInfo | undefined;
    blackout_dates: BlackoutDateInfo[];
    scheduling_engine?: SchedulingEngineConfigInfo | undefined;
    verification_policy?: VerificationPolicyConfigInfo | undefined;
}
export interface BatchSyncInventoryResponse {
    resources: ResourceInfo[];
    services: ServiceInfo[];
    success: boolean;
    message: string;
}
export interface CustomerSnapshotInfo {
    name: string;
    phone: string;
    email?: string | undefined;
}
export interface BookingInfo {
    booking_id: string;
    booking_reference: string;
    tenant_id: string;
    agent_id: string;
    service_id: string;
    resource_id?: string | undefined;
    customer_id: string;
    customer: CustomerSnapshotInfo | undefined;
    booking_mode: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    source: string;
    status: string;
    deposit_status: string;
    price: PriceInfo | undefined;
    deposit?: DepositInfo | undefined;
    notes?: string | undefined;
    created_by?: string | undefined;
    created_at: string;
    updated_at: string;
    resource_ids: string[];
    effective_end_time?: string | undefined;
    buffer_minutes?: number | undefined;
}
export interface CreateBookingRequest {
    tenant_id: string;
    agent_id: string;
    service_id: string;
    resource_id?: string | undefined;
    start_time: string;
    end_time?: string | undefined;
    customer_name: string;
    customer_phone: string;
    customer_email?: string | undefined;
    notes?: string | undefined;
    source?: string | undefined;
    deposit_status?: string | undefined;
    created_by?: string | undefined;
    resource_ids: string[];
}
export interface BookingResponse {
    booking: BookingInfo | undefined;
    message: string;
}
export interface CancelBookingRequest {
    tenant_id: string;
    booking_id: string;
    agent_id: string;
    reason?: string | undefined;
    cancelled_by?: string | undefined;
}
export interface RescheduleBookingRequest {
    tenant_id: string;
    booking_id: string;
    agent_id: string;
    new_start_time: string;
    new_end_time?: string | undefined;
    resource_id?: string | undefined;
    resource_ids: string[];
    rescheduled_by?: string | undefined;
    notes?: string | undefined;
}
export interface ListBookingsRequest {
    tenant_id: string;
    page: number;
    limit: number;
    agent_id?: string | undefined;
    service_id?: string | undefined;
    resource_id?: string | undefined;
    status?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    search?: string | undefined;
    customer_phone?: string | undefined;
}
export interface ListBookingsResponse {
    bookings: BookingInfo[];
    total: number;
    page: number;
    limit: number;
}
export interface GetAvailabilityRequest {
    tenant_id: string;
    agent_id: string;
    service_id: string;
    start_date: string;
    end_date?: string | undefined;
    resource_id?: string | undefined;
    timezone?: string | undefined;
    resource_ids: string[];
}
export interface AvailableSlotInfo {
    start_time: string;
    end_time: string;
    available: boolean;
    available_resource_ids: string[];
    reason?: string | undefined;
}
export interface ResourceAvailabilityInfo {
    resource_id: string;
    name: string;
    resource_type: string;
    is_available: boolean;
    busy_intervals: string[];
}
export interface DayAvailabilityInfo {
    date: string;
    is_closed: boolean;
    closure_reason?: string | undefined;
    has_availability: boolean;
    slots: AvailableSlotInfo[];
}
export interface GetAvailabilityResponse {
    service_id: string;
    booking_mode: string;
    timezone: string;
    days: DayAvailabilityInfo[];
    resources: ResourceAvailabilityInfo[];
    blocked_dates: string[];
}
export interface VerifyCustomerRequest {
    tenant_id: string;
    customer_phone: string;
    agent_id?: string | undefined;
}
export interface VerifyCustomerResponse {
    success: boolean;
    message: string;
    updated_count: number;
}
export interface ListCustomersRequest {
    tenant_id: string;
    agent_id?: string | undefined;
    page: number;
    limit: number;
    search?: string | undefined;
}
export interface CustomerDetails {
    id: string;
    tenant_id: string;
    agent_id: string;
    name: string;
    phone: string;
    email: string;
    notes: string;
    is_guest: boolean;
    total_bookings: number;
    created_at: string;
    updated_at: string;
}
export interface ListCustomersResponse {
    customers: CustomerDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}
export interface TenantScheduleInfo {
    id: string;
    tenant_id: string;
    agent_id: string;
    timezone: string;
    currency: string;
    operating_hours: OperatingHoursInfo | undefined;
    blackout_dates: BlackoutDateInfo[];
    scheduling_engine: SchedulingEngineConfigInfo | undefined;
    verification_policy: VerificationPolicyConfigInfo | undefined;
    created_at: string;
    updated_at: string;
}
export interface GetTenantScheduleRequest {
    tenant_id: string;
    agent_id: string;
}
export interface UpdateTenantScheduleRequest {
    tenant_id: string;
    agent_id: string;
    timezone?: string | undefined;
    currency?: string | undefined;
    operating_hours?: OperatingHoursInfo | undefined;
    blackout_dates: BlackoutDateInfo[];
    scheduling_engine?: SchedulingEngineConfigInfo | undefined;
    verification_policy?: VerificationPolicyConfigInfo | undefined;
}
export interface TenantScheduleResponse {
    success: boolean;
    message: string;
    schedule?: TenantScheduleInfo | undefined;
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
    /** Booking Operations */
    createBooking(request: CreateBookingRequest): Observable<BookingResponse>;
    cancelBooking(request: CancelBookingRequest): Observable<BookingResponse>;
    rescheduleBooking(request: RescheduleBookingRequest): Observable<BookingResponse>;
    getAvailability(request: GetAvailabilityRequest): Observable<GetAvailabilityResponse>;
    listBookings(request: ListBookingsRequest): Observable<ListBookingsResponse>;
    /** Customer Operations */
    verifyCustomer(request: VerifyCustomerRequest): Observable<VerifyCustomerResponse>;
    listCustomers(request: ListCustomersRequest): Observable<ListCustomersResponse>;
    /** Tenant Schedule Settings */
    getTenantSchedule(request: GetTenantScheduleRequest): Observable<TenantScheduleResponse>;
    updateTenantSchedule(request: UpdateTenantScheduleRequest): Observable<TenantScheduleResponse>;
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
    /** Booking Operations */
    createBooking(request: CreateBookingRequest): Promise<BookingResponse> | Observable<BookingResponse> | BookingResponse;
    cancelBooking(request: CancelBookingRequest): Promise<BookingResponse> | Observable<BookingResponse> | BookingResponse;
    rescheduleBooking(request: RescheduleBookingRequest): Promise<BookingResponse> | Observable<BookingResponse> | BookingResponse;
    getAvailability(request: GetAvailabilityRequest): Promise<GetAvailabilityResponse> | Observable<GetAvailabilityResponse> | GetAvailabilityResponse;
    listBookings(request: ListBookingsRequest): Promise<ListBookingsResponse> | Observable<ListBookingsResponse> | ListBookingsResponse;
    /** Customer Operations */
    verifyCustomer(request: VerifyCustomerRequest): Promise<VerifyCustomerResponse> | Observable<VerifyCustomerResponse> | VerifyCustomerResponse;
    listCustomers(request: ListCustomersRequest): Promise<ListCustomersResponse> | Observable<ListCustomersResponse> | ListCustomersResponse;
    /** Tenant Schedule Settings */
    getTenantSchedule(request: GetTenantScheduleRequest): Promise<TenantScheduleResponse> | Observable<TenantScheduleResponse> | TenantScheduleResponse;
    updateTenantSchedule(request: UpdateTenantScheduleRequest): Promise<TenantScheduleResponse> | Observable<TenantScheduleResponse> | TenantScheduleResponse;
}
export declare function SchedulingInventoryServiceControllerMethods(): (constructor: Function) => void;
export declare const SCHEDULING_INVENTORY_SERVICE_NAME = "SchedulingInventoryService";
//# sourceMappingURL=scheduling.d.ts.map