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
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { API_ROUTES } from '../constants/routes.constant.js';
import {
  CustomerChatDto,
  InitCustomerChatDto,
  PublicChatConfigQueryDto,
  PublicChatMessagesQueryDto,
} from '../dtos/customer-chat.dto.js';
import { CorsOriginGuard } from '../guards/cors-origin.guard.js';
import {
  createSignedSession,
  signSessionId,
  verifySessionToken,
} from '../utils/session-token.util.js';

@Controller(API_ROUTES.PUBLIC_CHAT.BASE)
@UseGuards(CorsOriginGuard)
export class CustomerChatController implements OnModuleInit {
  private _knowledgeService!: KnowledgeServiceClient;

  constructor(@Inject('KNOWLEDGE_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._knowledgeService = this._client.getService<KnowledgeServiceClient>('KnowledgeService');
  }

  @Post(API_ROUTES.PUBLIC_CHAT.INIT)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async init(@Body() body: InitCustomerChatDto) {
    let resolvedSessionId: string | undefined;
    let resolvedToken: string | undefined;
    let isFirstTime = true;
    let messages: any[] = [];

    if (body.token) {
      const verified = verifySessionToken(body.token, {
        expectedTenantId: body.tenant_id,
        expectedAgentId: body.agent_id,
      });
      if (verified.valid && verified.sessionId) {
        resolvedSessionId = verified.sessionId;
        resolvedToken = body.token;
      }
    } else if (body.session_id) {
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
  @UsePipes(ZodValidationPipe)
  async chat(@Body() body: CustomerChatDto) {
    let sessionId = body.session_id;
    let token = body.token;

    if (token) {
      const verified = verifySessionToken(token, {
        expectedTenantId: body.tenant_id,
        expectedAgentId: body.agent_id,
      });
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      sessionId = verified.sessionId;
      if (verified.tenantId) {
        body.tenant_id = verified.tenantId;
      }
      if (verified.agentId) {
        body.agent_id = verified.agentId;
      }
    } else if (sessionId) {
      if (sessionId.startsWith('sandbox_')) {
        throw new BadRequestException('Sandbox sessions are not allowed in public live chat.');
      }
      token = signSessionId(sessionId, body.tenant_id, body.agent_id);
    } else {
      const session = createSignedSession('sess', body.tenant_id, body.agent_id);
      sessionId = session.sessionId;
      token = session.token;
    }

    const response = await lastValueFrom(
      this._knowledgeService.customerChat({
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        session_id: sessionId,
        message: body.message,
        customer_id: body.customer_id,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name,
        mode: 'live',
      }),
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
  async getMessages(@Query() query: PublicChatMessagesQueryDto) {
    let resolvedSessionId = query.session_id;

    if (query.token) {
      const verified = verifySessionToken(query.token, {
        expectedTenantId: query.tenant_id,
        expectedAgentId: query.agent_id,
      });
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      resolvedSessionId = verified.sessionId;
      if (verified.tenantId) {
        query.tenant_id = verified.tenantId;
      }
      if (verified.agentId) {
        query.agent_id = verified.agentId;
      }
    }

    if (!resolvedSessionId) {
      throw new BadRequestException('session_id or valid token is required');
    }

    const response = await lastValueFrom(
      this._knowledgeService.getCustomerMessages({
        tenant_id: query.tenant_id,
        agent_id: query.agent_id,
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

