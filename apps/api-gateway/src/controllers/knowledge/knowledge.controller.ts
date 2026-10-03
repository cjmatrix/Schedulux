import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Inject,
  OnModuleInit,
  UsePipes,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { ZodValidationPipe } from "nestjs-zod";
import { KnowledgeServiceClient } from "@repo/proto/knowledge";
import { CrawlSiteDto, GetCrawlStatusDto } from "./dtos/knowledge.dto.js";
import { TenantAuthGuard } from "../../guards/tenant-auth.guard.js";
import { RolesGuard } from "../../guards/roles.guard.js";
import { Roles } from "../../decorators/roles.decorator.js";

@Controller("api/v1/tenant/knowledge")
// @UseGuards(TenantAuthGuard, RolesGuard)
// @Roles("tenant_owner", "root") 
export class KnowledgeController implements OnModuleInit {
  private knowledgeService!: KnowledgeServiceClient;

  constructor(
    @Inject("KNOWLEDGE_PACKAGE") private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.knowledgeService = this.client.getService<KnowledgeServiceClient>("KnowledgeService");
  }

  @Post("crawl")
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(ZodValidationPipe)
  async crawlSite(@Body() body: CrawlSiteDto) {
    const response = await lastValueFrom(
      this.knowledgeService.crawlSite({
        tenant_id: body.tenant_id,
        url: body.url,
      }),
    );
    return {
      message: response.message,
      data: {
        job_id: response.job_id,
        status: response.status,
      },
    };
  }

  @Get("crawl/status")
  @UsePipes(ZodValidationPipe)
  async getCrawlStatus(@Query() query: GetCrawlStatusDto) {
    const response = await lastValueFrom(
      this.knowledgeService.getCrawlStatus({
        tenant_id: query.tenant_id,
        job_id: query.job_id,
      }),
    );
    return {
      message: "Crawl status retrieved successfully",
      data: response,
    };
  }
}
