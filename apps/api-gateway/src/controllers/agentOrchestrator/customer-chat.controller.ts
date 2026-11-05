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
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import {
  createSignedSession,
  signSessionId,
  verifySessionToken,
} from '../../utils/session-token.util.js';
import { CustomerChatDto, InitCustomerChatDto } from './dtos/knowledge.dto.js';

@Controller(API_ROUTES.PUBLIC_CHAT.BASE)
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
      const verified = verifySessionToken(body.token);
      if (verified.valid && verified.sessionId) {
        resolvedSessionId = verified.sessionId;
        resolvedToken = body.token;
      }
    } else if (body.session_id) {
      if (body.session_id.startsWith('sandbox_')) {
        throw new BadRequestException('Sandbox sessions are not allowed in public live chat.');
      }
      resolvedSessionId = body.session_id;
      resolvedToken = signSessionId(body.session_id);
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
      const session = createSignedSession('sess');
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
      const verified = verifySessionToken(token);
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      sessionId = verified.sessionId;
    } else if (sessionId) {
      if (sessionId.startsWith('sandbox_')) {
        throw new BadRequestException('Sandbox sessions are not allowed in public live chat.');
      }
      token = signSessionId(sessionId);
    } else {
      const session = createSignedSession('sess');
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
        history: response.history || [],
        booking_id: response.booking_id || null,
        booking_reference: response.booking_reference || null,
        status: response.status || null,
      },
    };
  }

  @Get(API_ROUTES.PUBLIC_CHAT.MESSAGES)
  async getMessages(
    @Query('tenant_id') tenantId: string,
    @Query('agent_id') agentId: string,
    @Query('session_id') sessionId?: string,
    @Query('token') token?: string,
    @Query('limit') limitStr?: string,
    @Query('before') before?: string,
  ) {
    let resolvedSessionId = sessionId;

    if (token) {
      const verified = verifySessionToken(token);
      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }
      resolvedSessionId = verified.sessionId;
    }

    if (!tenantId || !agentId || !resolvedSessionId) {
      throw new BadRequestException(RESPONSE_MESSAGES.CHAT.REQUIRED_FIELDS);
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const response = await lastValueFrom(
      this._knowledgeService.getCustomerMessages({
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: resolvedSessionId,
        limit,
        before,
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
