import type { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
export declare const protobufPackage = "knowledge";
export interface GetAgentStatsRequest {
}
export interface GetAgentStatsResponse {
    total_agents: number;
    active_agents: number;
    draft_agents: number;
}
export interface CrawlSiteRequest {
    tenant_id: string;
    url: string;
}
export interface CrawlSiteResponse {
    message: string;
    job_id: string;
    status: string;
}
export interface GetCrawlStatusRequest {
    tenant_id: string;
    job_id: string;
}
export interface CrawlPageResult {
    url: string;
    markdown: string;
    success: boolean;
    error: string;
}
export interface GetCrawlStatusResponse {
    job_id: string;
    status: string;
    pages_crawled: number;
    pages: CrawlPageResult[];
}
export interface StartOnboardingRequest {
    tenant_id: string;
    initial_draft_json: string;
    agent_id: string;
}
export interface ResumeOnboardingRequest {
    tenant_id: string;
    user_answer: string;
    agent_id: string;
}
export interface OnboardingResponse {
    status: string;
    question: string;
    field: string;
    type: string;
    draft_schema_json: string;
    live_schema_json: string;
}
export interface SaveInitialAgentDraftRequest {
    tenant_id: string;
    draft_json: string;
    creation_source: string;
    name: string;
}
export interface SaveInitialAgentDraftResponse {
    message: string;
    agent_id: string;
    status: string;
}
export interface ListTenantAgentsRequest {
    tenant_id: string;
}
export interface AgentSummaryInfo {
    agent_id: string;
    name: string;
    /** "pending" or "created" */
    status: string;
    creation_source: string;
    services_count: number;
    updated_at: string;
    created_at: string;
}
export interface ListTenantAgentsResponse {
    agents: AgentSummaryInfo[];
}
export interface DeleteAgentRequest {
    tenant_id: string;
    agent_id: string;
}
export interface DeleteAgentResponse {
    success: boolean;
    message: string;
    agent_id: string;
}
export interface ChatMessageInfo {
    id: string;
    tenant_id: string;
    agent_id: string;
    /** "agent" or "tenant" */
    role: string;
    content: string;
    created_at: string;
}
export interface GetAgentMessagesRequest {
    tenant_id: string;
    agent_id: string;
    limit: number;
    before?: string | undefined;
}
export interface GetAgentMessagesResponse {
    messages: ChatMessageInfo[];
    next_cursor?: string | undefined;
    has_more: boolean;
}
export interface CustomerChatMessageInfo {
    id: string;
    session_id: string;
    tenant_id: string;
    agent_id: string;
    role: string;
    content: string;
    created_at: string;
}
export interface CustomerChatRequest {
    tenant_id: string;
    agent_id: string;
    session_id: string;
    message: string;
    customer_id?: string | undefined;
    customer_phone?: string | undefined;
    customer_name?: string | undefined;
    mode?: string | undefined;
}
export interface CustomerChatResponse {
    session_id: string;
    response: string;
    booking_id?: string | undefined;
    booking_reference?: string | undefined;
    status?: string | undefined;
    user_message_id: string;
    agent_message_id: string;
    created_at: string;
}
export interface GetCustomerMessagesRequest {
    tenant_id: string;
    agent_id: string;
    session_id: string;
    limit?: number | undefined;
    before?: string | undefined;
}
export interface GetCustomerMessagesResponse {
    messages: CustomerChatMessageInfo[];
    next_cursor?: string | undefined;
    has_more: boolean;
}
export interface GetWidgetConfigRequest {
    tenant_id: string;
    agent_id: string;
    /** "draft" or "live" */
    source: string;
}
export interface GetWidgetConfigResponse {
    tenant_id: string;
    agent_id: string;
    widget_config_json: string;
}
export interface UpdateWidgetConfigRequest {
    tenant_id: string;
    agent_id: string;
    whitelisted_domains: string[];
    widget_config_json?: string | undefined;
}
export interface UpdateWidgetConfigResponse {
    message: string;
    success: boolean;
    widget_config_json: string;
}
export interface GetDocumentUploadUrlRequest {
    tenant_id: string;
    agent_id: string;
    file_name: string;
    file_size_bytes: number;
}
export interface GetDocumentUploadUrlResponse {
    upload_url: string;
    document_id: string;
    s3_key: string;
    expires_in: number;
}
export interface ConfirmDocumentUploadRequest {
    tenant_id: string;
    document_id: string;
}
export interface ConfirmDocumentUploadResponse {
    success: boolean;
    message: string;
}
export interface DocumentInfo {
    id: string;
    tenant_id: string;
    agent_id: string;
    file_name: string;
    file_size_bytes: number;
    s3_key: string;
    s3_bucket: string;
    status: string;
    created_at: string;
    updated_at: string;
}
export interface ListDocumentsRequest {
    tenant_id: string;
    agent_id: string;
}
export interface ListDocumentsResponse {
    documents: DocumentInfo[];
}
export interface DeleteDocumentRequest {
    tenant_id: string;
    document_id: string;
}
export interface DeleteDocumentResponse {
    success: boolean;
    message: string;
}
export declare const KNOWLEDGE_PACKAGE_NAME = "knowledge";
export interface KnowledgeServiceClient {
    crawlSite(request: CrawlSiteRequest, metadata?: Metadata): Observable<CrawlSiteResponse>;
    getCrawlStatus(request: GetCrawlStatusRequest, metadata?: Metadata): Observable<GetCrawlStatusResponse>;
    startOnboardingSession(request: StartOnboardingRequest, metadata?: Metadata): Observable<OnboardingResponse>;
    resumeOnboardingSession(request: ResumeOnboardingRequest, metadata?: Metadata): Observable<OnboardingResponse>;
    saveInitialAgentDraft(request: SaveInitialAgentDraftRequest, metadata?: Metadata): Observable<SaveInitialAgentDraftResponse>;
    listTenantAgents(request: ListTenantAgentsRequest, metadata?: Metadata): Observable<ListTenantAgentsResponse>;
    deleteAgent(request: DeleteAgentRequest, metadata?: Metadata): Observable<DeleteAgentResponse>;
    getAgentMessages(request: GetAgentMessagesRequest, metadata?: Metadata): Observable<GetAgentMessagesResponse>;
    customerChat(request: CustomerChatRequest, metadata?: Metadata): Observable<CustomerChatResponse>;
    getCustomerMessages(request: GetCustomerMessagesRequest, metadata?: Metadata): Observable<GetCustomerMessagesResponse>;
    getWidgetConfig(request: GetWidgetConfigRequest, metadata?: Metadata): Observable<GetWidgetConfigResponse>;
    updateWidgetConfig(request: UpdateWidgetConfigRequest, metadata?: Metadata): Observable<UpdateWidgetConfigResponse>;
    getDocumentUploadUrl(request: GetDocumentUploadUrlRequest, metadata?: Metadata): Observable<GetDocumentUploadUrlResponse>;
    confirmDocumentUpload(request: ConfirmDocumentUploadRequest, metadata?: Metadata): Observable<ConfirmDocumentUploadResponse>;
    listDocuments(request: ListDocumentsRequest, metadata?: Metadata): Observable<ListDocumentsResponse>;
    deleteDocument(request: DeleteDocumentRequest, metadata?: Metadata): Observable<DeleteDocumentResponse>;
    getAgentStats(request: GetAgentStatsRequest, metadata?: Metadata): Observable<GetAgentStatsResponse>;
}
export interface KnowledgeServiceController {
    crawlSite(request: CrawlSiteRequest, metadata?: Metadata): Promise<CrawlSiteResponse> | Observable<CrawlSiteResponse> | CrawlSiteResponse;
    getCrawlStatus(request: GetCrawlStatusRequest, metadata?: Metadata): Promise<GetCrawlStatusResponse> | Observable<GetCrawlStatusResponse> | GetCrawlStatusResponse;
    startOnboardingSession(request: StartOnboardingRequest, metadata?: Metadata): Promise<OnboardingResponse> | Observable<OnboardingResponse> | OnboardingResponse;
    resumeOnboardingSession(request: ResumeOnboardingRequest, metadata?: Metadata): Promise<OnboardingResponse> | Observable<OnboardingResponse> | OnboardingResponse;
    saveInitialAgentDraft(request: SaveInitialAgentDraftRequest, metadata?: Metadata): Promise<SaveInitialAgentDraftResponse> | Observable<SaveInitialAgentDraftResponse> | SaveInitialAgentDraftResponse;
    listTenantAgents(request: ListTenantAgentsRequest, metadata?: Metadata): Promise<ListTenantAgentsResponse> | Observable<ListTenantAgentsResponse> | ListTenantAgentsResponse;
    deleteAgent(request: DeleteAgentRequest, metadata?: Metadata): Promise<DeleteAgentResponse> | Observable<DeleteAgentResponse> | DeleteAgentResponse;
    getAgentMessages(request: GetAgentMessagesRequest, metadata?: Metadata): Promise<GetAgentMessagesResponse> | Observable<GetAgentMessagesResponse> | GetAgentMessagesResponse;
    customerChat(request: CustomerChatRequest, metadata?: Metadata): Promise<CustomerChatResponse> | Observable<CustomerChatResponse> | CustomerChatResponse;
    getCustomerMessages(request: GetCustomerMessagesRequest, metadata?: Metadata): Promise<GetCustomerMessagesResponse> | Observable<GetCustomerMessagesResponse> | GetCustomerMessagesResponse;
    getWidgetConfig(request: GetWidgetConfigRequest, metadata?: Metadata): Promise<GetWidgetConfigResponse> | Observable<GetWidgetConfigResponse> | GetWidgetConfigResponse;
    updateWidgetConfig(request: UpdateWidgetConfigRequest, metadata?: Metadata): Promise<UpdateWidgetConfigResponse> | Observable<UpdateWidgetConfigResponse> | UpdateWidgetConfigResponse;
    getDocumentUploadUrl(request: GetDocumentUploadUrlRequest, metadata?: Metadata): Promise<GetDocumentUploadUrlResponse> | Observable<GetDocumentUploadUrlResponse> | GetDocumentUploadUrlResponse;
    confirmDocumentUpload(request: ConfirmDocumentUploadRequest, metadata?: Metadata): Promise<ConfirmDocumentUploadResponse> | Observable<ConfirmDocumentUploadResponse> | ConfirmDocumentUploadResponse;
    listDocuments(request: ListDocumentsRequest, metadata?: Metadata): Promise<ListDocumentsResponse> | Observable<ListDocumentsResponse> | ListDocumentsResponse;
    deleteDocument(request: DeleteDocumentRequest, metadata?: Metadata): Promise<DeleteDocumentResponse> | Observable<DeleteDocumentResponse> | DeleteDocumentResponse;
    getAgentStats(request: GetAgentStatsRequest, metadata?: Metadata): Promise<GetAgentStatsResponse> | Observable<GetAgentStatsResponse> | GetAgentStatsResponse;
}
export declare function KnowledgeServiceControllerMethods(): (constructor: Function) => void;
export declare const KNOWLEDGE_SERVICE_NAME = "KnowledgeService";
//# sourceMappingURL=knowledge.d.ts.map