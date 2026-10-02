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
export declare const KNOWLEDGE_PACKAGE_NAME = "knowledge";
export interface KnowledgeServiceClient {
    crawlSite(request: CrawlSiteRequest): Observable<CrawlSiteResponse>;
    getCrawlStatus(request: GetCrawlStatusRequest): Observable<GetCrawlStatusResponse>;
}
export interface KnowledgeServiceController {
    crawlSite(request: CrawlSiteRequest): Promise<CrawlSiteResponse> | Observable<CrawlSiteResponse> | CrawlSiteResponse;
    getCrawlStatus(request: GetCrawlStatusRequest): Promise<GetCrawlStatusResponse> | Observable<GetCrawlStatusResponse> | GetCrawlStatusResponse;
}
export declare function KnowledgeServiceControllerMethods(): (constructor: Function) => void;
export declare const KNOWLEDGE_SERVICE_NAME = "KnowledgeService";
//# sourceMappingURL=knowledge.d.ts.map