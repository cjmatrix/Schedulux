import { Metadata } from '@grpc/grpc-js';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { trace } from '@opentelemetry/api';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { API_ROUTES } from '../constants/routes.constant.js';
import { TenantTokenQuotaGuard } from '../guards/tenant-token-quota.guard.js';
import {
  CustomerChatDto,
  InitCustomerChatDto,
  PublicChatConfigQueryDto,
  PublicChatMessagesQueryDto,
} from '../dtos/customer-chat.dto.js';
import { CorsOriginGuard } from '../guards/cors-origin.guard.js';
import { CustomerSessionGuard } from '../guards/customer-session.guard.js';
import {
  createSignedSession,
  signSessionId,
} from '../utils/session-token.util.js';

@Controller(API_ROUTES.PUBLIC_CHAT.BASE)
@UseGuards(CorsOriginGuard, CustomerSessionGuard)
export class CustomerChatController implements OnModuleInit {
  private _knowledgeService!: KnowledgeServiceClient;

  constructor(@Inject('KNOWLEDGE_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._knowledgeService = this._client.getService<KnowledgeServiceClient>('KnowledgeService');
  }

  @Post(API_ROUTES.PUBLIC_CHAT.INIT)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async init(@Req() req: Request, @Body() body: InitCustomerChatDto) {
    let resolvedSessionId = req.customerSession?.sessionId;
    let resolvedToken = req.customerSession?.token;
    let isFirstTime = true;
    let messages: any[] = [];

    if (!resolvedSessionId && body.session_id) {
      if (body.session_id.startsWith('sandbox_')) {
        throw new BadRequestException('Sandbox sessions are not allowed in public live chat.');
      }
      resolvedSessionId = body.session_id;
      resolvedToken = signSessionId(body.session_id, body.tenant_id, body.agent_id);
    }

    if (resolvedSessionId && resolvedToken) {
      try {
        const response = await lastValueFrom(
          this._knowledgeService.getCustomerMessages({
            tenant_id: body.tenant_id,
            agent_id: body.agent_id,
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
      const session = createSignedSession('sess', body.tenant_id, body.agent_id);
      resolvedSessionId = session.sessionId;
      resolvedToken = session.token;
      isFirstTime = true;
      messages = [];

      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        activeSpan.setAttribute('session.id', resolvedSessionId);
      }
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

  @Post(API_ROUTES.PUBLIC_CHAT.ROOT)
  @HttpCode(HttpStatus.OK)
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  async chat(@Req() req: Request, @Body() body: CustomerChatDto) {
    let sessionId = req.customerSession?.sessionId || body.session_id;
    let token = req.customerSession?.token || body.token;

    if (!sessionId) {
      const session = createSignedSession('sess', body.tenant_id, body.agent_id);
      sessionId = session.sessionId;
      token = session.token;

      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        activeSpan.setAttribute('session.id', sessionId);
      }
    } else if (!token) {
      token = signSessionId(sessionId, body.tenant_id, body.agent_id);
    }

    const metadata = new Metadata();
    const verifiedTier = (req as any).verifiedTier;
    if (verifiedTier) {
      metadata.set('x-tenant-tier', verifiedTier);
      metadata.set('x-quota-verified', 'true');
    }

    const response = await lastValueFrom(
      this._knowledgeService.customerChat(
        {
          tenant_id: body.tenant_id,
          agent_id: body.agent_id,
          session_id: sessionId,
          message: body.message,
          customer_id: body.customer_id,
          customer_phone: body.customer_phone,
          customer_name: body.customer_name,
          mode: 'live',
        },
        metadata,
      ),
    );

    return {
      message: RESPONSE_MESSAGES.CHAT.CHAT_PROCESSED,
      data: {
        session_id: response.session_id,
        token,
        response: response.response,
        user_message_id: response.user_message_id,
        agent_message_id: response.agent_message_id,
        created_at: response.created_at,
        booking_id: response.booking_id || null,
        booking_reference: response.booking_reference || null,
        status: response.status || null,
      },
    };
  }

  @Post(API_ROUTES.PUBLIC_CHAT.STREAM)
  @HttpCode(HttpStatus.OK)
  @UseGuards(TenantTokenQuotaGuard)
  @UsePipes(ZodValidationPipe)
  chatStream(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: CustomerChatDto,
  ) {
    let sessionId = req.customerSession?.sessionId || body.session_id;
    let token = req.customerSession?.token || body.token;

    if (!sessionId) {
      const session = createSignedSession('sess', body.tenant_id, body.agent_id);
      sessionId = session.sessionId;
      token = session.token;

      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        activeSpan.setAttribute('session.id', sessionId);
      }
    } else if (!token) {
      token = signSessionId(sessionId, body.tenant_id, body.agent_id);
    }

    const metadata = new Metadata();
    const verifiedTier = (req as any).verifiedTier;
    if (verifiedTier) {
      metadata.set('x-tenant-tier', verifiedTier);
      metadata.set('x-quota-verified', 'true');
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const stream$ = this._knowledgeService.customerChatStream(
      {
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        session_id: sessionId,
        message: body.message,
        customer_id: body.customer_id,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name,
        mode: 'live',
      },
      metadata,
    );

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
        res.write(
          `data: ${JSON.stringify({ event_type: 'error', error: err.message || 'Stream error' })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    req.on('close', () => {
      subscription.unsubscribe();
    });
  }

  @Get(API_ROUTES.PUBLIC_CHAT.CONFIG)
  @UsePipes(ZodValidationPipe)
  async getConfig(@Query() query: PublicChatConfigQueryDto) {
    const response = await lastValueFrom(
      this._knowledgeService.getWidgetConfig({
        tenant_id: query.tenant_id,
        agent_id: query.agent_id,
        source: 'live',
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
      message: RESPONSE_MESSAGES.CHAT.CONFIG_RETRIEVED,
      data: {
        tenant_id: response.tenant_id || query.tenant_id,
        agent_id: response.agent_id || query.agent_id,
        widget_config: widgetConfig,
      },
    };
  }

  @Get(API_ROUTES.PUBLIC_CHAT.MESSAGES)
  @UsePipes(ZodValidationPipe)
  async getMessages(@Req() req: Request, @Query() query: PublicChatMessagesQueryDto) {
    const resolvedSessionId = req.customerSession?.sessionId || query.session_id;

    if (!resolvedSessionId) {
      throw new BadRequestException('session_id or valid token is required');
    }

    const response = await lastValueFrom(
      this._knowledgeService.getCustomerMessages({
        tenant_id: req.customerSession?.tenantId || query.tenant_id,
        agent_id: req.customerSession?.agentId || query.agent_id,
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
}

