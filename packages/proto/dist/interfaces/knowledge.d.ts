import { Observable } from "rxjs";
export declare const protobufPackage = "knowledge";
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
}
export interface CustomerChatResponse {
    session_id: string;
    response: string;
    history: CustomerChatMessageInfo[];
    booking_id?: string | undefined;
    booking_reference?: string | undefined;
    status?: string | undefined;
}
export interface GetCustomerMessagesRequest {
    tenant_id: string;
    agent_id: string;
    session_id: string;
    limit?: number | undefined;
}
export interface GetCustomerMessagesResponse {
    messages: CustomerChatMessageInfo[];
}
export declare const KNOWLEDGE_PACKAGE_NAME = "knowledge";
export interface KnowledgeServiceClient {
    crawlSite(request: CrawlSiteRequest): Observable<CrawlSiteResponse>;
    getCrawlStatus(request: GetCrawlStatusRequest): Observable<GetCrawlStatusResponse>;
    startOnboardingSession(request: StartOnboardingRequest): Observable<OnboardingResponse>;
    resumeOnboardingSession(request: ResumeOnboardingRequest): Observable<OnboardingResponse>;
    saveInitialAgentDraft(request: SaveInitialAgentDraftRequest): Observable<SaveInitialAgentDraftResponse>;
    listTenantAgents(request: ListTenantAgentsRequest): Observable<ListTenantAgentsResponse>;
    getAgentMessages(request: GetAgentMessagesRequest): Observable<GetAgentMessagesResponse>;
    customerChat(request: CustomerChatRequest): Observable<CustomerChatResponse>;
    getCustomerMessages(request: GetCustomerMessagesRequest): Observable<GetCustomerMessagesResponse>;
}
export interface KnowledgeServiceController {
    crawlSite(request: CrawlSiteRequest): Promise<CrawlSiteResponse> | Observable<CrawlSiteResponse> | CrawlSiteResponse;
    getCrawlStatus(request: GetCrawlStatusRequest): Promise<GetCrawlStatusResponse> | Observable<GetCrawlStatusResponse> | GetCrawlStatusResponse;
    startOnboardingSession(request: StartOnboardingRequest): Promise<OnboardingResponse> | Observable<OnboardingResponse> | OnboardingResponse;
    resumeOnboardingSession(request: ResumeOnboardingRequest): Promise<OnboardingResponse> | Observable<OnboardingResponse> | OnboardingResponse;
    saveInitialAgentDraft(request: SaveInitialAgentDraftRequest): Promise<SaveInitialAgentDraftResponse> | Observable<SaveInitialAgentDraftResponse> | SaveInitialAgentDraftResponse;
    listTenantAgents(request: ListTenantAgentsRequest): Promise<ListTenantAgentsResponse> | Observable<ListTenantAgentsResponse> | ListTenantAgentsResponse;
    getAgentMessages(request: GetAgentMessagesRequest): Promise<GetAgentMessagesResponse> | Observable<GetAgentMessagesResponse> | GetAgentMessagesResponse;
    customerChat(request: CustomerChatRequest): Promise<CustomerChatResponse> | Observable<CustomerChatResponse> | CustomerChatResponse;
    getCustomerMessages(request: GetCustomerMessagesRequest): Promise<GetCustomerMessagesResponse> | Observable<GetCustomerMessagesResponse> | GetCustomerMessagesResponse;
}
export declare function KnowledgeServiceControllerMethods(): (constructor: Function) => void;
export declare const KNOWLEDGE_SERVICE_NAME = "KnowledgeService";
//# sourceMappingURL=knowledge.d.ts.map