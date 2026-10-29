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
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { CustomerChatDto } from './dtos/knowledge.dto.js';

@Controller(API_ROUTES.PUBLIC_CHAT.BASE)
export class CustomerChatController implements OnModuleInit {
  private _knowledgeService!: KnowledgeServiceClient;

  constructor(@Inject('KNOWLEDGE_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._knowledgeService = this._client.getService<KnowledgeServiceClient>('KnowledgeService');
  }

  @Post(API_ROUTES.PUBLIC_CHAT.ROOT)
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async chat(@Body() body: CustomerChatDto) {
    const response = await lastValueFrom(
      this._knowledgeService.customerChat({
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        session_id: body.session_id,
        message: body.message,
        customer_id: body.customer_id,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.CHAT.CHAT_PROCESSED,
      data: {
        session_id: response.session_id,
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
    @Query('session_id') sessionId: string,
    @Query('limit') limitStr?: string,
  ) {
    if (!tenantId || !agentId || !sessionId) {
      throw new BadRequestException(RESPONSE_MESSAGES.CHAT.REQUIRED_FIELDS);
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const response = await lastValueFrom(
      this._knowledgeService.getCustomerMessages({
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: sessionId,
        limit,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.CHAT.MESSAGES_RETRIEVED,
      data: {
        messages: response.messages || [],
      },
    };
  }
}

