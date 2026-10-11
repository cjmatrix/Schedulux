import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
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

  private readonly logger = new Logger(SchemaGateway.name);

  constructor(
    @Inject('ISchemaEventSubscriber')
    private readonly eventSubscriber: ISchemaEventSubscriber,
  ) {}

  onModuleInit() {
    this.eventSubscriber.onSchemaGenerated((event: SchemaGeneratedEvent) => {
      this.handleSchemaGenerated(event);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:job')
  handleJoinJob(@ConnectedSocket() client: Socket, @MessageBody() data: { job_id: string }) {
    if (data?.job_id) {
      const room = `job:${data.job_id}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { status: 'joined', room };
    }
    return { status: 'error', message: 'Missing job_id' };
  }

  @SubscribeMessage('join:tenant')
  handleJoinTenant(@ConnectedSocket() client: Socket, @MessageBody() data: { tenant_id: string }) {
    if (data?.tenant_id) {
      const room = `tenant:${data.tenant_id}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { status: 'joined', room };
    }
    return { status: 'error', message: 'Missing tenant_id' };
  }

  private handleSchemaGenerated(event: SchemaGeneratedEvent) {
    this.logger.log(`Broadcasting schema:ready for job ${event.job_id} / tenant ${event.tenant_id}`);

    this.server.to(`job:${event.job_id}`).emit('schema:ready', event);

   
    this.server.to(`tenant:${event.tenant_id}`).emit('schema:ready', event);
  }
}
