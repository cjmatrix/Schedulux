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
}
export interface ResumeOnboardingRequest {
    tenant_id: string;
    user_answer: string;
}
export interface OnboardingResponse {
    status: string;
    question: string;
    field: string;
    type: string;
    draft_schema_json: string;
}
export declare const KNOWLEDGE_PACKAGE_NAME = "knowledge";
export interface KnowledgeServiceClient {
    crawlSite(request: CrawlSiteRequest): Observable<CrawlSiteResponse>;
    getCrawlStatus(request: GetCrawlStatusRequest): Observable<GetCrawlStatusResponse>;
    startOnboardingSession(request: StartOnboardingRequest): Observable<OnboardingResponse>;
    resumeOnboardingSession(request: ResumeOnboardingRequest): Observable<OnboardingResponse>;
}
export interface KnowledgeServiceController {
    crawlSite(request: CrawlSiteRequest): Promise<CrawlSiteResponse> | Observable<CrawlSiteResponse> | CrawlSiteResponse;
    getCrawlStatus(request: GetCrawlStatusRequest): Promise<GetCrawlStatusResponse> | Observable<GetCrawlStatusResponse> | GetCrawlStatusResponse;
    startOnboardingSession(request: StartOnboardingRequest): Promise<OnboardingResponse> | Observable<OnboardingResponse> | OnboardingResponse;
    resumeOnboardingSession(request: ResumeOnboardingRequest): Promise<OnboardingResponse> | Observable<OnboardingResponse> | OnboardingResponse;
}
export declare function KnowledgeServiceControllerMethods(): (constructor: Function) => void;
export declare const KNOWLEDGE_SERVICE_NAME = "KnowledgeService";
//# sourceMappingURL=knowledge.d.ts.map