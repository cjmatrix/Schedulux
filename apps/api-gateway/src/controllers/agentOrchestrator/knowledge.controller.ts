import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Inject,
  OnModuleInit,
  UsePipes,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { ZodValidationPipe } from "nestjs-zod";
import { KnowledgeServiceClient } from "@repo/proto/knowledge";
import {
  CrawlSiteDto,
  GetCrawlStatusDto,
  StartOnboardingDto,
  ResumeOnboardingDto,
  SaveInitialAgentDraftDto,
} from "./dtos/knowledge.dto.js";
import { TenantAuthGuard, AuthenticatedTenantRequest } from "../../guards/tenant-auth.guard.js";
import { RolesGuard } from "../../guards/roles.guard.js";
import { Roles } from "../../decorators/roles.decorator.js";

import { ISchemaCacheService } from "../../interfaces/ISchemaEventSubscriber.js";

@Controller("api/v1/tenant/knowledge")
@UseGuards(TenantAuthGuard, RolesGuard)
@Roles("tenant_owner", "root") 
export class KnowledgeController implements OnModuleInit {
  private knowledgeService!: KnowledgeServiceClient;

  constructor(
    @Inject("KNOWLEDGE_PACKAGE") private client: ClientGrpc,
    @Inject("ISchemaCacheService") private readonly schemaCacheService: ISchemaCacheService,
  ) {}

  onModuleInit() {
    this.knowledgeService = this.client.getService<KnowledgeServiceClient>("KnowledgeService");
  }

  @Post("crawl")
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(ZodValidationPipe)
  async crawlSite(@Body() body: CrawlSiteDto) {

    console.log("crawling")
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

  @Get("schema")
  async getSchema(
    @Query("tenant_id") tenantId: string,
    @Query("job_id") jobId?: string,
  ) {
    if (!tenantId) {
      return {
        message: "tenant_id is required",
        data: null,
      };
    }
    const schema = await this.schemaCacheService.getDraftSchema(tenantId, jobId);
    if (!schema) {
      return {
        message: "Draft schema is still being generated or not found",
        data: {
          status: "pending",
          schema: null,
        },
      };
    }
    return {
      message: "Draft schema retrieved successfully",
      data: {
        status: "completed",
        schema,
      },
    };
  }

  @Post("onboarding/start")
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async startOnboarding(@Body() body: StartOnboardingDto) {
    const response = await lastValueFrom(
      this.knowledgeService.startOnboardingSession({
        tenant_id: body.tenant_id,
        initial_draft_json: body.initial_draft_json || "{}",
        agent_id: body.agent_id || "",
      })
    );
    return {
      message: "Session started",
      data: {
        status: response.status,
        question: response.question,
        field: response.field,
        type: response.type,
        draft_schema: JSON.parse(response.draft_schema_json || '{}')
      }
    };
  }

  @Post("onboarding/message")
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async resumeOnboarding(@Body() body: ResumeOnboardingDto) {
    const response = await lastValueFrom(
      this.knowledgeService.resumeOnboardingSession({
        tenant_id: body.tenant_id,
        user_answer: body.user_answer,
        agent_id: body.agent_id || "",
      })
    );
    return {
      message: "Message processed",
      data: {
        status: response.status,
        question: response.question,
        field: response.field,
        type: response.type,
        draft_schema: JSON.parse(response.draft_schema_json || '{}')
      }
    };
  }

  @Post("agents/draft")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async saveInitialDraft(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: SaveInitialAgentDraftDto,
  ) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id || body.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException("Tenant ID is required");
    }

    const response = await lastValueFrom(
      this.knowledgeService.saveInitialAgentDraft({
        tenant_id: tenantId,
        draft_json: body.draft_json || "",
        creation_source: body.creation_source || "web_crawl",
        name: body.name || "",
      })
    );

    return {
      message: response.message,
      data: {
        agent_id: response.agent_id,
        status: response.status,
      },
    };
  }

  @Get("agents")
  async listAgents(@Req() req: AuthenticatedTenantRequest) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException("Tenant ID is required");
    }

    const response = await lastValueFrom(
      this.knowledgeService.listTenantAgents({
        tenant_id: tenantId,
      })
    );

    return {
      message: "Agents retrieved successfully",
      data: response.agents || [],
    };
  }
}
