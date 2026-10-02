import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { KnowledgeService } from "../services/knowledgeService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";
import {
  CrawlSiteRequest,
  GetCrawlStatusRequest,
} from "@repo/proto/knowledge";

@Controller()
@UseFilters(new AllExceptionsFilter())
export class KnowledgeController {
  constructor(
    @Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService,
  ) {}

  @GrpcMethod("KnowledgeService", "CrawlSite")
  async crawlSite(data: CrawlSiteRequest) {
    const { tenant_id, url } = data;
    if (!tenant_id || !url) {
      throw new Error("Missing required fields");
    }
    return await this.knowledgeService.crawlSite(tenant_id, url);
  }

  @GrpcMethod("KnowledgeService", "GetCrawlStatus")
  async getCrawlStatus(data: GetCrawlStatusRequest) {
    const { tenant_id, job_id } = data;
    if (!tenant_id || !job_id) {
      throw new Error("Missing required fields");
    }
    return await this.knowledgeService.getCrawlStatus(tenant_id, job_id);
  }
}
