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
import { CustomerChatDto } from './dtos/knowledge.dto.js';

@Controller('api/v1/public/chat')
export class CustomerChatController implements OnModuleInit {
  private knowledgeService!: KnowledgeServiceClient;

  constructor(@Inject('KNOWLEDGE_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.knowledgeService = this.client.getService<KnowledgeServiceClient>('KnowledgeService');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  async chat(@Body() body: CustomerChatDto) {
    const response = await lastValueFrom(
      this.knowledgeService.customerChat({
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
      message: 'Chat processed successfully',
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

  @Get('messages')
  async getMessages(
    @Query('tenant_id') tenantId: string,
    @Query('agent_id') agentId: string,
    @Query('session_id') sessionId: string,
    @Query('limit') limitStr?: string,
  ) {
    if (!tenantId || !agentId || !sessionId) {
      throw new BadRequestException('tenant_id, agent_id, and session_id are required');
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const response = await lastValueFrom(
      this.knowledgeService.getCustomerMessages({
        tenant_id: tenantId,
        agent_id: agentId,
        session_id: sessionId,
        limit,
      }),
    );

    return {
      message: 'Messages retrieved successfully',
      data: {
        messages: response.messages || [],
      },
    };
  }
}
