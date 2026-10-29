import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { Roles } from '../../decorators/roles.decorator.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import { ISchemaCacheService } from '../../interfaces/ISchemaEventSubscriber.js';
import {
  CrawlSiteDto,
  GetCrawlStatusDto,
  ResumeOnboardingDto,
  SaveInitialAgentDraftDto,
  SendSandboxMessageDto,
  StartOnboardingDto,
} from './dtos/knowledge.dto.js';

@Controller(API_ROUTES.KNOWLEDGE.BASE)
@UseGuards(TenantAuthGuard, RolesGuard)
@Roles('tenant_owner', 'root')
export class KnowledgeController implements OnModuleInit {
  private _knowledgeService!: KnowledgeServiceClient;

  constructor(
    @Inject('KNOWLEDGE_PACKAGE') private readonly _client: ClientGrpc,
    @Inject('ISchemaCacheService') private readonly _schemaCacheService: ISchemaCacheService,
  ) {}

  onModuleInit() {
    this._knowledgeService = this._client.getService<KnowledgeServiceClient>('KnowledgeService');
  }

  @Post(API_ROUTES.KNOWLEDGE.CRAWL)
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(ZodValidationPipe)
  async crawlSite(@Body() body: CrawlSiteDto) {
    const response = await lastValueFrom(
      this._knowledgeService.crawlSite({
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

  @Get(API_ROUTES.KNOWLEDGE.CRAWL_STATUS)
  @UsePipes(ZodValidationPipe)
  async getCrawlStatus(@Query() query: GetCrawlStatusDto) {
    const response = await lastValueFrom(
      this._knowledgeService.getCrawlStatus({
        tenant_id: query.tenant_id,
        job_id: query.job_id,
      }),
    );
    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.CRAWL_STATUS_RETRIEVED,
      data: response,
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.SCHEMA)
  async getSchema(@Query('tenant_id') tenantId: string, @Query('job_id') jobId?: string) {
    if (!tenantId) {
      return {
        message: RESPONSE_MESSAGES.KNOWLEDGE.TENANT_ID_REQUIRED,
        data: null,
      };
    }
    const schema = await this._schemaCacheService.getDraftSchema(tenantId, jobId);
    if (!schema) {
      return {
        message: RESPONSE_MESSAGES.KNOWLEDGE.SCHEMA_PENDING,
        data: {
          status: 'pending',
          schema: null,
        },
      };
    }
    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.SCHEMA_RETRIEVED,
      data: {
        status: 'completed',
        schema,
      },
    };
  }

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_START)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async startOnboarding(@Body() body: StartOnboardingDto) {
    const response = await lastValueFrom(
      this._knowledgeService.startOnboardingSession({
        tenant_id: body.tenant_id,
        initial_draft_json: body.initial_draft_json || '{}',
        agent_id: body.agent_id || '',
      }),
    );
    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.SESSION_STARTED,
      data: {
        status: response.status,
        question: response.question,
        field: response.field,
        type: response.type,
        draft_schema: JSON.parse(response.draft_schema_json || '{}'),
        live_schema: JSON.parse(response.live_schema_json || '{}'),
      },
    };
  }

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_MESSAGE)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async resumeOnboarding(@Body() body: ResumeOnboardingDto) {
    const response = await lastValueFrom(
      this._knowledgeService.resumeOnboardingSession({
        tenant_id: body.tenant_id,
        user_answer: body.user_answer,
        agent_id: body.agent_id || '',
      }),
    );
    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.MESSAGE_PROCESSED,
      data: {
        status: response.status,
        question: response.question,
        field: response.field,
        type: response.type,
        draft_schema: JSON.parse(response.draft_schema_json || '{}'),
        live_schema: JSON.parse(response.live_schema_json || '{}'),
      },
    };
  }

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async sandboxChat(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: SendSandboxMessageDto,
  ) {
    const tenantId = body.tenant_id || req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }
    const agentId = body.agent_id || 'default';
    const sessionId = body.session_id || `sandbox_${tenantId}_${agentId}`;

    const response = await lastValueFrom(
      this._knowledgeService.customerChat({
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: sessionId,
        message: body.message,
        customer_id: body.customer_id || '',
        customer_phone: body.customer_phone || '',
        customer_name: body.customer_name || 'Sandbox Tester',
      }),
    );

    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.SANDBOX_CHAT_PROCESSED,
      data: {
        reply: response.response,
        session_id: response.session_id,
        history: response.history || [],
      },
    };
  }

  @Post(API_ROUTES.KNOWLEDGE.AGENTS_DRAFT)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async saveInitialDraft(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: SaveInitialAgentDraftDto,
  ) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id || body.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }

    const response = await lastValueFrom(
      this._knowledgeService.saveInitialAgentDraft({
        tenant_id: tenantId,
        draft_json: body.draft_json || '',
        creation_source: body.creation_source || 'web_crawl',
        name: body.name || '',
      }),
    );

    return {
      message: response.message,
      data: {
        agent_id: response.agent_id,
        status: response.status,
      },
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.AGENTS)
  async listAgents(@Req() req: AuthenticatedTenantRequest) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }

    const response = await lastValueFrom(
      this._knowledgeService.listTenantAgents({
        tenant_id: tenantId,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.AGENTS_RETRIEVED,
      data: response.agents || [],
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.AGENT_MESSAGES)
  async getAgentMessages(
    @Req() req: AuthenticatedTenantRequest,
    @Param('agentId') agentId: string,
    @Query('limit') limitStr?: string,
    @Query('before') before?: string,
  ) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const response = await lastValueFrom(
      this._knowledgeService.getAgentMessages({
        tenant_id: tenantId,
        agent_id: agentId,
        limit,
        before,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
      data: {
        messages: response.messages || [],
        next_cursor: response.next_cursor || null,
        has_more: response.has_more ?? false,
      },
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.ONBOARDING_MESSAGES)
  async getOnboardingMessages(
    @Req() req: AuthenticatedTenantRequest,
    @Query('agent_id') agentIdQuery?: string,
    @Query('limit') limitStr?: string,
    @Query('before') before?: string,
  ) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }

    if (!agentIdQuery) {
      throw new BadRequestException(RESPONSE_MESSAGES.AUTH.AGENT_ID_REQUIRED);
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const response = await lastValueFrom(
      this._knowledgeService.getAgentMessages({
        tenant_id: tenantId,
        agent_id: agentIdQuery,
        limit,
        before,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
      data: {
        messages: response.messages || [],
        next_cursor: response.next_cursor || null,
        has_more: response.has_more ?? false,
      },
    };
  }
}

