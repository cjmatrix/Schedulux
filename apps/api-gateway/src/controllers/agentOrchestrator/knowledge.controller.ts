import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
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
import { getTierConfig } from '../../constants/tiers.constant.js';
import { Roles } from '../../decorators/roles.decorator.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import { ISchemaCacheService } from '../../interfaces/ISchemaEventSubscriber.js';
import {
  ConfirmDocumentUploadDto,
  CrawlSiteDto,
  GetAgentMessagesQueryDto,
  GetCrawlStatusDto,
  GetDocumentUploadUrlDto,
  GetOnboardingMessagesQueryDto,
  GetSandboxMessagesQueryDto,
  GetSandboxWidgetConfigQueryDto,
  GetSchemaQueryDto,
  InitSandboxChatDto,
  ListDocumentsQueryDto,
  ResumeOnboardingDto,
  SaveInitialAgentDraftDto,
  SendSandboxMessageDto,
  StartOnboardingDto,
  UpdateWidgetConfigDto,
} from './dtos/knowledge.dto.js';
import {
  createSignedSession,
  signSessionId,
  verifySessionToken,
} from '../../utils/session-token.util.js';
import { createTenantGrpcMetadata } from '../../utils/grpc-metadata.util.js';

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

  private _getTenantId(req: AuthenticatedTenantRequest): string {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }
    return tenantId;
  }

  private _getTenantTier(req: AuthenticatedTenantRequest): string {
    return req.tenant?.tier || req.dashboardUser?.tier || 'starter';
  }

  @Post(API_ROUTES.KNOWLEDGE.CRAWL)
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(ZodValidationPipe)
  async crawlSite(@Req() req: AuthenticatedTenantRequest, @Body() body: CrawlSiteDto) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.crawlSite({
        tenant_id: tenantId,
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
  async getCrawlStatus(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetCrawlStatusDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.getCrawlStatus({
        tenant_id: tenantId,
        job_id: query.job_id,
      }),
    );
    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.CRAWL_STATUS_RETRIEVED,
      data: response,
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.SCHEMA)
  @UsePipes(ZodValidationPipe)
  async getSchema(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetSchemaQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const schema = await this._schemaCacheService.getDraftSchema(tenantId, query.job_id);
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
  async startOnboarding(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: StartOnboardingDto,
  ) {
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await lastValueFrom(
      this._knowledgeService.startOnboardingSession(
        {
          tenant_id: tenantId,
          initial_draft_json: body.initial_draft_json || '{}',
          agent_id: body.agent_id || '',
        },
        metadata,
      ),
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
  async resumeOnboarding(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: ResumeOnboardingDto,
  ) {
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await lastValueFrom(
      this._knowledgeService.resumeOnboardingSession(
        {
          tenant_id: tenantId,
          user_answer: body.user_answer,
          agent_id: body.agent_id || '',
        },
        metadata,
      ),
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

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_INIT)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async sandboxInit(@Req() req: AuthenticatedTenantRequest, @Body() body: InitSandboxChatDto) {
    const tenantId = this._getTenantId(req);
    const agentId = body.agent_id || 'default';

    let resolvedSessionId: string | undefined;
    let resolvedToken: string | undefined;
    let isFirstTime = true;
    let messages: any[] = [];

    if (body.token) {
      const verified = verifySessionToken(body.token);
      if (verified.valid && verified.sessionId) {
        resolvedSessionId = verified.sessionId;
        resolvedToken = body.token;
      }
    } else if (body.session_id) {
      resolvedSessionId = body.session_id;
      resolvedToken = signSessionId(body.session_id);
    }

    if (resolvedSessionId && resolvedToken) {
      try {
        const response = await lastValueFrom(
          this._knowledgeService.getCustomerMessages({
            tenant_id: tenantId,
            agent_id: agentId,
            session_id: resolvedSessionId,
            limit: 20,
          }),
        );
        messages = response.messages || [];
        isFirstTime = messages.length === 0;

        return {
          message: RESPONSE_MESSAGES.CHAT.SESSION_INITIALIZED,
          data: {
            is_first_time: isFirstTime,
            session_id: resolvedSessionId,
            token: resolvedToken,
            messages,
            next_cursor: response.next_cursor || null,
            has_more: Boolean(response.has_more),
          },
        };
      } catch {
        isFirstTime = true;
        messages = [];
      }
    } else {
      const session = createSignedSession(`sandbox_${tenantId}_${agentId}`);
      resolvedSessionId = session.sessionId;
      resolvedToken = session.token;
      isFirstTime = true;
      messages = [];
    }

    return {
      message: RESPONSE_MESSAGES.CHAT.SESSION_INITIALIZED,
      data: {
        is_first_time: isFirstTime,
        session_id: resolvedSessionId,
        token: resolvedToken,
        messages,
        next_cursor: null,
        has_more: false,
      },
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_CONFIG)
  @UsePipes(ZodValidationPipe)
  async getSandboxWidgetConfig(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetSandboxWidgetConfigQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const agentId = query.agent_id || 'default';

    const response = await lastValueFrom(
      this._knowledgeService.getWidgetConfig({
        tenant_id: tenantId,
        agent_id: agentId,
        source: 'draft',
      }),
    );

    let widgetConfig = {};
    if (response.widget_config_json) {
      try {
        widgetConfig = JSON.parse(response.widget_config_json);
      } catch {
        widgetConfig = {};
      }
    }

    return {
      message: 'Sandbox widget configuration retrieved',
      data: {
        tenant_id: response.tenant_id || tenantId,
        agent_id: response.agent_id || agentId,
        widget_config: widgetConfig,
      },
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_MESSAGES)
  @UsePipes(ZodValidationPipe)
  async getSandboxMessages(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetSandboxMessagesQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const agentId = query.agent_id || 'default';
    let resolvedSessionId = query.session_id;

    if (query.token) {
      const verified = verifySessionToken(query.token);
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      resolvedSessionId = verified.sessionId;
    }

    if (!resolvedSessionId) {
      throw new BadRequestException(RESPONSE_MESSAGES.CHAT.REQUIRED_FIELDS);
    }

    const response = await lastValueFrom(
      this._knowledgeService.getCustomerMessages({
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: resolvedSessionId,
        limit: query.limit,
        before: query.before,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
      data: {
        messages: response.messages || [],
        next_cursor: response.next_cursor || null,
        has_more: Boolean(response.has_more),
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
    const tenantId = this._getTenantId(req);
    const agentId = body.agent_id || 'default';

    let sessionId = body.session_id;
    let token = body.token;

    if (token) {
      const verified = verifySessionToken(token);
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      sessionId = verified.sessionId;
    } else if (sessionId) {
      token = signSessionId(sessionId);
    } else {
      const session = createSignedSession(`sandbox_${tenantId}_${agentId}`);
      sessionId = session.sessionId;
      token = session.token;
    }

    const response = await lastValueFrom(
      this._knowledgeService.customerChat({
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: sessionId,
        message: body.message,
        customer_id: body.customer_id || '',
        customer_phone: body.customer_phone || '',
        customer_name: body.customer_name || 'Sandbox Tester',
        mode: 'sandbox',
      }),
    );

    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.SANDBOX_CHAT_PROCESSED,
      data: {
        reply: response.response,
        response: response.response,
        session_id: response.session_id,
        token,
        user_message_id: response.user_message_id,
        agent_message_id: response.agent_message_id,
        created_at: response.created_at,
        booking_id: response.booking_id || undefined,
        booking_reference: response.booking_reference || undefined,
        status: response.status || undefined,
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
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await lastValueFrom(
      this._knowledgeService.saveInitialAgentDraft(
        {
          tenant_id: tenantId,
          draft_json: body.draft_json || '',
          creation_source: body.creation_source || 'web_crawl',
          name: body.name || '',
        },
        metadata,
      ),
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
    const tenantId = this._getTenantId(req);
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
  @UsePipes(ZodValidationPipe)
  async getAgentMessages(
    @Req() req: AuthenticatedTenantRequest,
    @Param('agentId') agentId: string,
    @Query() query: GetAgentMessagesQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.getAgentMessages({
        tenant_id: tenantId,
        agent_id: agentId,
        limit: query.limit,
        before: query.before,
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
  @UsePipes(ZodValidationPipe)
  async getOnboardingMessages(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetOnboardingMessagesQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.getAgentMessages({
        tenant_id: tenantId,
        agent_id: query.agent_id,
        limit: query.limit,
        before: query.before,
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

  @Post(API_ROUTES.KNOWLEDGE.DOCUMENTS_UPLOAD_URL)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async getDocumentUploadUrl(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: GetDocumentUploadUrlDto,
  ) {
    const tenantId = this._getTenantId(req);
    const tenantTier = this._getTenantTier(req);
    const tierConfig = getTierConfig(tenantTier);

    if (body.file_size_bytes && body.file_size_bytes > 0) {
      const maxAllowedBytes = tierConfig.max_kb_doc_size_mb * 1024 * 1024;
      if (body.file_size_bytes > maxAllowedBytes) {
        throw new BadRequestException(
          `File size (${(body.file_size_bytes / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of ${tierConfig.max_kb_doc_size_mb} MB for your tier (${tierConfig.name}). Please upgrade your tier to upload larger files.`,
        );
      }
    }

    const metadata = createTenantGrpcMetadata(tenantId, tenantTier);

    const response = await lastValueFrom(
      this._knowledgeService.getDocumentUploadUrl(
        {
          tenant_id: tenantId,
          agent_id: body.agent_id,
          file_name: body.file_name,
          file_size_bytes: body.file_size_bytes || 0,
        },
        metadata,
      ),
    );
    return {
      message: 'Presigned upload URL generated successfully',
      data: {
        upload_url: response.upload_url,
        document_id: response.document_id,
        s3_key: response.s3_key,
        expires_in: response.expires_in,
      },
    };
  }

  @Post(API_ROUTES.KNOWLEDGE.DOCUMENTS_CONFIRM)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async confirmDocumentUpload(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: ConfirmDocumentUploadDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.confirmDocumentUpload({
        tenant_id: tenantId,
        document_id: body.document_id,
      }),
    );
    return {
      message: response.message,
      data: { success: response.success },
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.DOCUMENTS)
  @UsePipes(ZodValidationPipe)
  async listDocuments(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: ListDocumentsQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.listDocuments({
        tenant_id: tenantId,
        agent_id: query.agent_id || '',
      }),
    );
    return {
      message: 'Documents retrieved successfully',
      data: response.documents || [],
    };
  }

  @Delete(API_ROUTES.KNOWLEDGE.DOCUMENT_BY_ID)
  @HttpCode(HttpStatus.OK)
  async deleteDocument(
    @Req() req: AuthenticatedTenantRequest,
    @Param('documentId') documentId: string,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.deleteDocument({
        tenant_id: tenantId,
        document_id: documentId,
      }),
    );
    return {
      message: response.message,
      data: { success: response.success },
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.WIDGET_CONFIG)
  @HttpCode(HttpStatus.OK)
  async getWidgetConfig(
    @Req() req: AuthenticatedTenantRequest,
    @Param('agentId') agentId: string,
    @Query('source') source?: string,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.getWidgetConfig({
        tenant_id: tenantId,
        agent_id: agentId,
        source: source || 'live',
      }),
    );

    let widgetConfig = {};
    if (response.widget_config_json) {
      try {
        widgetConfig = JSON.parse(response.widget_config_json);
      } catch {
        widgetConfig = {};
      }
    }

    return {
      message: 'Widget configuration retrieved',
      data: {
        tenant_id: response.tenant_id || tenantId,
        agent_id: response.agent_id || agentId,
        widget_config: widgetConfig,
      },
    };
  }

  @Put(API_ROUTES.KNOWLEDGE.WIDGET_CONFIG)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async updateWidgetConfig(
    @Req() req: AuthenticatedTenantRequest,
    @Param('agentId') agentId: string,
    @Body() body: UpdateWidgetConfigDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._knowledgeService.updateWidgetConfig({
        tenant_id: tenantId,
        agent_id: agentId,
        whitelisted_domains: body.whitelisted_domains,
        widget_config_json: body.widget_config_json,
      }),
    );

    let widgetConfig = {};
    if (response.widget_config_json) {
      try {
        widgetConfig = JSON.parse(response.widget_config_json);
      } catch {
        widgetConfig = {};
      }
    }

    return {
      message: response.message,
      data: {
        success: response.success,
        widget_config: widgetConfig,
      },
    };
  }
}
