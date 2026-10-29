import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import {
  ISchemaEventSubscriber,
  SchemaGeneratedEvent,
} from '../interfaces/ISchemaEventSubscriber.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class SchemaGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server!: Server;

  private readonly _logger = new Logger(SchemaGateway.name);

  constructor(
    @Inject('ISchemaEventSubscriber')
    private readonly _eventSubscriber: ISchemaEventSubscriber,
  ) {}

  onModuleInit() {
    this._eventSubscriber.onSchemaGenerated((event: SchemaGeneratedEvent) => {
      this._handleSchemaGenerated(event);
    });
  }

  handleConnection(client: Socket) {
    this._logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this._logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:job')
  handleJoinJob(@ConnectedSocket() client: Socket, @MessageBody() data: { job_id: string }) {
    if (data?.job_id) {
      const room = `job:${data.job_id}`;
      client.join(room);
      this._logger.log(`Client ${client.id} joined room ${room}`);
      return { status: RESPONSE_MESSAGES.WEBSOCKET.JOINED, room };
    }
    return { status: RESPONSE_MESSAGES.WEBSOCKET.ERROR, message: RESPONSE_MESSAGES.WEBSOCKET.MISSING_JOB_ID };
  }

  @SubscribeMessage('join:tenant')
  handleJoinTenant(@ConnectedSocket() client: Socket, @MessageBody() data: { tenant_id: string }) {
    if (data?.tenant_id) {
      const room = `tenant:${data.tenant_id}`;
      client.join(room);
      this._logger.log(`Client ${client.id} joined room ${room}`);
      return { status: RESPONSE_MESSAGES.WEBSOCKET.JOINED, room };
    }
    return { status: RESPONSE_MESSAGES.WEBSOCKET.ERROR, message: RESPONSE_MESSAGES.WEBSOCKET.MISSING_TENANT_ID };
  }

  private _handleSchemaGenerated(event: SchemaGeneratedEvent) {
    if (event.event === 'SCHEMA_GENERATION_FAILED' || event.error) {
      this._logger.warn(`Broadcasting schema:failed for job ${event.job_id}: ${event.error}`);
      const payload = {
        job_id: event.job_id,
        tenant_id: event.tenant_id,
        error: event.error || RESPONSE_MESSAGES.WEBSOCKET.SCHEMA_GENERATION_FAILED,
      };
      this.server.to(`job:${event.job_id}`).emit('schema:failed', payload);
      this.server.to(`tenant:${event.tenant_id}`).emit('schema:failed', payload);
      return;
    }

    this._logger.log(
      `Broadcasting schema:ready for job ${event.job_id} / tenant ${event.tenant_id}`,
    );

    this.server.to(`job:${event.job_id}`).emit('schema:ready', event);
    this.server.to(`tenant:${event.tenant_id}`).emit('schema:ready', event);
  }
}

