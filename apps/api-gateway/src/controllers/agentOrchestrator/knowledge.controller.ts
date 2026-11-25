import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  MessageEvent,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  Sse,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom, Observable } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { Roles } from '../../decorators/roles.decorator.js';
import { CrawlQuotaGuard } from '../../guards/crawl-quota.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import { TenantTokenQuotaGuard } from '../../guards/tenant-token-quota.guard.js';
import {
  ISchemaCacheService,
  ISchemaEventSubscriber,
} from '../../interfaces/ISchemaEventSubscriber.js';
import { RedisService } from '../../services/redis.service.js';
import { CIRCUIT_BREAKER_SERVICE, ICircuitBreakerService } from '@repo/circuit-breaker';
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
@Roles('tenant_owner')
export class KnowledgeController implements OnModuleInit {
  private readonly _logger = new Logger(KnowledgeController.name);
  private _knowledgeService!: KnowledgeServiceClient;

  constructor(
    @Inject('KNOWLEDGE_PACKAGE') private readonly _client: ClientGrpc,
    @Inject('ISchemaCacheService') private readonly _schemaCacheService: ISchemaCacheService,
    @Inject('ISchemaEventSubscriber')
    private readonly _schemaEventSubscriber: ISchemaEventSubscriber,
    @Inject(RedisService) private readonly _redisService: RedisService,
    @Inject(CIRCUIT_BREAKER_SERVICE)
    private readonly _circuitBreakerService: ICircuitBreakerService,
  ) {}

  private async _executeKnowledgeData<T>(action: () => Promise<T>): Promise<T> {
    return this._circuitBreakerService.execute('knowledge-data', action);
  }

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
  @UseGuards(CrawlQuotaGuard)
  @UsePipes(ZodValidationPipe)
  async crawlSite(
    @Req() req: AuthenticatedTenantRequest & {
      crawlQuota?: { tenantId: string; weeklyLimit: number };
    },
    @Body() body: CrawlSiteDto,
  ) {
    const tenantId = this._getTenantId(req);
    const weeklyLimit = req.crawlQuota?.weeklyLimit ?? 5;

    const response = await this._circuitBreakerService.execute('knowledge-crawl', () =>
      lastValueFrom(
        this._knowledgeService.crawlSite({
          tenant_id: tenantId,
          url: body.url,
        }),
      ),
    );

    if (response.job_id) {
      await this._redisService.acquireCrawlLock(tenantId, response.job_id, 900);
      await this._redisService.recordCrawlUsage(tenantId, weeklyLimit);
    }

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
  async getCrawlStatus(@Req() req: AuthenticatedTenantRequest, @Query() query: GetCrawlStatusDto) {
    const tenantId = this._getTenantId(req);
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getCrawlStatus({
          tenant_id: tenantId,
          job_id: query.job_id,
        }),
      ),
    );

    const normalizedStatus = (response.status || '').toLowerCase();
    if (['completed', 'failed', 'error', 'finished'].includes(normalizedStatus)) {
      await this._redisService.releaseCrawlLock(tenantId);
    }

    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.CRAWL_STATUS_RETRIEVED,
      data: response,
    };
  }

  @Get(API_ROUTES.KNOWLEDGE.SCHEMA)
  @UsePipes(ZodValidationPipe)
  async getSchema(@Req() req: AuthenticatedTenantRequest, @Query() query: GetSchemaQueryDto) {
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

  @Sse(API_ROUTES.KNOWLEDGE.SCHEMA_STREAM)
  @UsePipes(ZodValidationPipe)
  streamSchema(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetSchemaQueryDto,
  ): Observable<MessageEvent> {
    const tenantId = this._getTenantId(req);
    const targetJobId = query.job_id;

    return new Observable<MessageEvent>((subscriber) => {
      let isCompleted = false;

      this._schemaCacheService
        .getDraftSchema(tenantId, targetJobId)
        .then((existingSchema) => {
          if (existingSchema && !isCompleted) {
            isCompleted = true;
            subscriber.next({
              type: 'schema:ready',
              data: {
                tenant_id: tenantId,
                job_id: targetJobId || '',
                schema: existingSchema,
                status: 'completed',
              },
            });
            subscriber.complete();
          }
        })
        .catch(() => {});

      const unsubscribe = this._schemaEventSubscriber.onSchemaGenerated(
        tenantId,
        targetJobId || '',
        (event) => {
          if (isCompleted) return;

          if (event.event === 'SCHEMA_GENERATION_FAILED' || event.error) {
            isCompleted = true;
            subscriber.next({
              type: 'schema:failed',
              data: {
                job_id: event.job_id,
                tenant_id: event.tenant_id,
                error: event.error || RESPONSE_MESSAGES.WEBSOCKET.SCHEMA_GENERATION_FAILED,
                status: 'failed',
              },
            });
            subscriber.complete();
            return;
          }

          isCompleted = true;
          subscriber.next({
            type: 'schema:ready',
            data: {
              job_id: event.job_id,
              tenant_id: event.tenant_id,
              schema: event.schema,
              status: 'completed',
            },
          });
          subscriber.complete();
        },
      );

      const heartbeatInterval = setInterval(() => {
        if (!isCompleted) {
          subscriber.next({
            type: 'ping',
            data: { time: Date.now() },
          });
        }
      }, 20000);

      return () => {
        isCompleted = true;
        clearInterval(heartbeatInterval);
        unsubscribe();
      };
    });
  }

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_START)
  @HttpCode(HttpStatus.OK)
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  async startOnboarding(@Req() req: AuthenticatedTenantRequest, @Body() body: StartOnboardingDto) {
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await this._circuitBreakerService.execute('knowledge-onboarding-unary', () =>
      lastValueFrom(
        this._knowledgeService.startOnboardingSession(
          {
            tenant_id: tenantId,
            initial_draft_json: body.initial_draft_json || '{}',
            agent_id: body.agent_id || '',
          },
          metadata,
        ),
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
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  async resumeOnboarding(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: ResumeOnboardingDto,
  ) {
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await this._circuitBreakerService.execute(
      'knowledge-onboarding-unary',
      () =>
        lastValueFrom(
          this._knowledgeService.resumeOnboardingSession(
            {
              tenant_id: tenantId,
              user_answer: body.user_answer,
              agent_id: body.agent_id || '',
            },
            metadata,
          ),
        ),
      (err) => {
        this._logger.warn(
          `[KnowledgeController] resumeOnboarding fallback triggered: ${err.message}`,
        );
        return {
          status: 'error',
          question:
            'The AI Architect is temporarily unavailable due to high demand. Please retry in a few moments.',
          field: '',
          type: 'text',
          draft_schema_json: '{}',
          live_schema_json: '{}',
        } as any;
      },
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

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_MESSAGE_STREAM)
  @HttpCode(HttpStatus.OK)
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  resumeOnboardingStream(
    @Req() req: AuthenticatedTenantRequest,
    @Res() res: Response,
    @Body() body: ResumeOnboardingDto,
  ) {
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    if (this._circuitBreakerService.isOpen('knowledge-onboarding-stream')) {
      this._logger.warn(
        `[KnowledgeController] Breaker "knowledge-onboarding-stream" is OPEN. Fast-failing stream.`,
      );
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      res.write(
        `data: ${JSON.stringify({
          event_type: 'token',
          content:
            'The AI Architect is temporarily busy due to high demand. Please retry in a few moments.',
        })}\n\n`,
      );
      res.write(
        `data: ${JSON.stringify({
          event_type: 'done',
          status: 'degraded',
        })}\n\n`,
      );
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const stream$ = this._knowledgeService.resumeOnboardingSessionStream(
      {
        tenant_id: tenantId,
        user_answer: body.user_answer,
        agent_id: body.agent_id || '',
      },
      metadata,
    );

    let streamFailed = false;
    const subscription = stream$.subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      error: (err) => {
        streamFailed = true;
        this._circuitBreakerService.recordFailure('knowledge-onboarding-stream', err);
        this._logger.warn(`[KnowledgeController] Stream error recorded in breaker: ${err.message}`);
        res.write(
          `data: ${JSON.stringify({
            event_type: 'error',
            error: err.message || 'Stream error',
          })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        if (!streamFailed) {
          this._circuitBreakerService.recordSuccess('knowledge-onboarding-stream');
        }
        res.end();
      },
    });

    req.on('close', () => {
      subscription.unsubscribe();
    });
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
      const verified = verifySessionToken(body.token, {
        expectedTenantId: tenantId,
        expectedAgentId: agentId,
      });
      if (verified.valid && verified.sessionId) {
        resolvedSessionId = verified.sessionId;
        resolvedToken = body.token;
      }
    } else if (body.session_id) {
      resolvedSessionId = body.session_id;
      resolvedToken = signSessionId(body.session_id, tenantId, agentId);
    }

    if (resolvedSessionId && resolvedToken) {
      const currentSessionId = resolvedSessionId;
      try {
        const response = await this._executeKnowledgeData(() =>
          lastValueFrom(
            this._knowledgeService.getCustomerMessages({
              tenant_id: tenantId,
              agent_id: agentId,
              session_id: currentSessionId,
              limit: 20,
            }),
          ),
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
      const session = createSignedSession(`sandbox_${tenantId}_${agentId}`, tenantId, agentId);
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

    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getWidgetConfig({
          tenant_id: tenantId,
          agent_id: agentId,
          source: 'draft',
        }),
      ),
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
      const verified = verifySessionToken(query.token, {
        expectedTenantId: tenantId,
        expectedAgentId: agentId,
      });
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      resolvedSessionId = verified.sessionId;
    }

    if (!resolvedSessionId) {
      throw new BadRequestException(RESPONSE_MESSAGES.CHAT.REQUIRED_FIELDS);
    }

    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getCustomerMessages({
          tenant_id: tenantId,
          agent_id: agentId,
          session_id: resolvedSessionId,
          limit: query.limit,
          before: query.before,
        }),
      ),
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
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  async sandboxChat(@Req() req: AuthenticatedTenantRequest, @Body() body: SendSandboxMessageDto) {
    const tenantId = this._getTenantId(req);
    const agentId = body.agent_id || 'default';

    let sessionId = body.session_id;
    let token = body.token;

    if (token) {
      const verified = verifySessionToken(token, {
        expectedTenantId: tenantId,
        expectedAgentId: agentId,
      });
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      sessionId = verified.sessionId;
    } else if (sessionId) {
      token = signSessionId(sessionId, tenantId, agentId);
    } else {
      const session = createSignedSession(`sandbox_${tenantId}_${agentId}`, tenantId, agentId);
      sessionId = session.sessionId;
      token = session.token;
    }

    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await this._circuitBreakerService.execute(
      'knowledge-sandbox-unary',
      () =>
        lastValueFrom(
          this._knowledgeService.customerChat(
            {
              tenant_id: tenantId,
              agent_id: agentId,
              session_id: sessionId,
              message: body.message,
              customer_id: body.customer_id || '',
              customer_phone: body.customer_phone || '',
              customer_name: body.customer_name || 'Sandbox Tester',
              mode: 'sandbox',
            },
            metadata,
          ),
        ),
      (err) => {
        this._logger.warn(`[KnowledgeController] sandboxChat fallback triggered: ${err.message}`);
        return {
          session_id: sessionId,
          response:
            'Sandbox agent is temporarily unavailable due to high load. Please try again shortly.',
          user_message_id: `fallback-usr-${Date.now()}`,
          agent_message_id: `fallback-agent-${Date.now()}`,
          created_at: new Date().toISOString(),
          booking_id: '',
          booking_reference: '',
          status: 'degraded',
        } as any;
      },
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

  @Post(API_ROUTES.KNOWLEDGE.ONBOARDING_SANDBOX_STREAM)
  @HttpCode(HttpStatus.OK)
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  sandboxChatStream(
    @Req() req: AuthenticatedTenantRequest,
    @Res() res: Response,
    @Body() body: SendSandboxMessageDto,
  ) {
    const tenantId = this._getTenantId(req);
    const agentId = body.agent_id || 'default';

    let sessionId = body.session_id;
    let token = body.token;

    if (token) {
      const verified = verifySessionToken(token, {
        expectedTenantId: tenantId,
        expectedAgentId: agentId,
      });
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      sessionId = verified.sessionId;
    } else if (sessionId) {
      token = signSessionId(sessionId, tenantId, agentId);
    } else {
      const session = createSignedSession(`sandbox_${tenantId}_${agentId}`, tenantId, agentId);
      sessionId = session.sessionId;
      token = session.token;
    }

    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    if (this._circuitBreakerService.isOpen('knowledge-sandbox-stream')) {
      this._logger.warn(
        `[KnowledgeController] Breaker "knowledge-sandbox-stream" is OPEN. Fast-failing sandbox stream.`,
      );
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      res.write(
        `data: ${JSON.stringify({
          event_type: 'token',
          content: 'Sandbox agent is temporarily unavailable. Please retry in a moment.',
          token,
          session_id: sessionId,
        })}\n\n`,
      );
      res.write(
        `data: ${JSON.stringify({
          event_type: 'done',
          token,
          session_id: sessionId,
          status: 'degraded',
        })}\n\n`,
      );
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const stream$ = this._knowledgeService.customerChatStream(
      {
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: sessionId,
        message: body.message,
        customer_id: body.customer_id || '',
        customer_phone: body.customer_phone || '',
        customer_name: body.customer_name || 'Sandbox Tester',
        mode: 'sandbox',
      },
      metadata,
    );

    let streamFailed = false;
    const subscription = stream$.subscribe({
      next: (chunk) => {
        const payload = {
          ...chunk,
          token,
          session_id: chunk.session_id || sessionId,
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      },
      error: (err) => {
        streamFailed = true;
        this._circuitBreakerService.recordFailure('knowledge-sandbox-stream', err);
        this._logger.warn(
          `[KnowledgeController] Sandbox stream error recorded in breaker: ${err.message}`,
        );
        res.write(
          `data: ${JSON.stringify({
            event_type: 'error',
            error: err.message || 'Stream error',
          })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        if (!streamFailed) {
          this._circuitBreakerService.recordSuccess('knowledge-sandbox-stream');
        }
        res.end();
      },
    });

    req.on('close', () => {
      subscription.unsubscribe();
    });
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

    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.saveInitialAgentDraft(
          {
            tenant_id: tenantId,
            draft_json: body.draft_json || '',
            creation_source: body.creation_source || 'web_crawl',
            name: body.name || '',
          },
          metadata,
        ),
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
  @Roles('tenant_owner', 'manager')
  async listAgents(@Req() req: AuthenticatedTenantRequest) {
    const tenantId = this._getTenantId(req);
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.listTenantAgents({
          tenant_id: tenantId,
        }),
      ),
    );

    let agents = response.agents || [];
    if (req.dashboardUser?.agent_ids && req.dashboardUser.agent_ids.length > 0) {
      agents = agents.filter((a) => req.dashboardUser!.agent_ids!.includes(a.agent_id));
    }

    return {
      message: RESPONSE_MESSAGES.KNOWLEDGE.AGENTS_RETRIEVED,
      data: agents,
    };
  }

  @Delete(API_ROUTES.KNOWLEDGE.AGENT_BY_ID)
  @Roles('tenant_owner')
  async deleteAgent(@Req() req: AuthenticatedTenantRequest, @Param('agentId') agentId: string) {
    const tenantId = this._getTenantId(req);
    const tier = this._getTenantTier(req);
    const metadata = createTenantGrpcMetadata(tenantId, tier);

    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.deleteAgent(
          {
            tenant_id: tenantId,
            agent_id: agentId,
          },
          metadata,
        ),
      ),
    );

    return {
      message: response.message || RESPONSE_MESSAGES.KNOWLEDGE.AGENT_DELETED,
      data: {
        success: response.success,
        agent_id: response.agent_id || agentId,
      },
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getAgentMessages({
          tenant_id: tenantId,
          agent_id: agentId,
          limit: query.limit,
          before: query.before,
        }),
      ),
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getAgentMessages({
          tenant_id: tenantId,
          agent_id: query.agent_id,
          limit: query.limit,
          before: query.before,
        }),
      ),
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
    const tierConfig = await this._redisService.getCachedTierConfig(tenantTier);

    if (body.file_size_bytes && body.file_size_bytes > 0) {
      const maxAllowedBytes = tierConfig.max_kb_doc_size_mb * 1024 * 1024;
      if (body.file_size_bytes > maxAllowedBytes) {
        throw new BadRequestException(
          `File size (${(body.file_size_bytes / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of ${tierConfig.max_kb_doc_size_mb} MB for your tier (${tierConfig.name}). Please upgrade your tier to upload larger files.`,
        );
      }
    }

    const metadata = createTenantGrpcMetadata(tenantId, tenantTier);

    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getDocumentUploadUrl(
          {
            tenant_id: tenantId,
            agent_id: body.agent_id,
            file_name: body.file_name,
            file_size_bytes: body.file_size_bytes || 0,
          },
          metadata,
        ),
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.confirmDocumentUpload({
          tenant_id: tenantId,
          document_id: body.document_id,
        }),
      ),
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.listDocuments({
          tenant_id: tenantId,
          agent_id: query.agent_id || '',
        }),
      ),
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.deleteDocument({
          tenant_id: tenantId,
          document_id: documentId,
        }),
      ),
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.getWidgetConfig({
          tenant_id: tenantId,
          agent_id: agentId,
          source: source || 'live',
        }),
      ),
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
    const response = await this._executeKnowledgeData(() =>
      lastValueFrom(
        this._knowledgeService.updateWidgetConfig({
          tenant_id: tenantId,
          agent_id: agentId,
          whitelisted_domains: body.whitelisted_domains,
          widget_config_json: body.widget_config_json,
        }),
      ),
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
