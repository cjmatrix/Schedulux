"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SchemaGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const messages_constant_js_1 = require("../constants/messages.constant.js");
let SchemaGateway = SchemaGateway_1 = class SchemaGateway {
    _eventSubscriber;
    server;
    _logger = new common_1.Logger(SchemaGateway_1.name);
    constructor(_eventSubscriber) {
        this._eventSubscriber = _eventSubscriber;
    }
    onModuleInit() {
        this._eventSubscriber.onSchemaGenerated((event) => {
            this._handleSchemaGenerated(event);
        });
    }
    handleConnection(client) {
        this._logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this._logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinJob(client, data) {
        if (data?.job_id) {
            const room = `job:${data.job_id}`;
            client.join(room);
            this._logger.log(`Client ${client.id} joined room ${room}`);
            return { status: messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.JOINED, room };
        }
        return { status: messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.ERROR, message: messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.MISSING_JOB_ID };
    }
    handleJoinTenant(client, data) {
        if (data?.tenant_id) {
            const room = `tenant:${data.tenant_id}`;
            client.join(room);
            this._logger.log(`Client ${client.id} joined room ${room}`);
            return { status: messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.JOINED, room };
        }
        return { status: messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.ERROR, message: messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.MISSING_TENANT_ID };
    }
    _handleSchemaGenerated(event) {
        if (event.event === 'SCHEMA_GENERATION_FAILED' || event.error) {
            this._logger.warn(`Broadcasting schema:failed for job ${event.job_id}: ${event.error}`);
            const payload = {
                job_id: event.job_id,
                tenant_id: event.tenant_id,
                error: event.error || messages_constant_js_1.RESPONSE_MESSAGES.WEBSOCKET.SCHEMA_GENERATION_FAILED,
            };
            this.server.to(`job:${event.job_id}`).emit('schema:failed', payload);
            this.server.to(`tenant:${event.tenant_id}`).emit('schema:failed', payload);
            return;
        }
        this._logger.log(`Broadcasting schema:ready for job ${event.job_id} / tenant ${event.tenant_id}`);
        this.server.to(`job:${event.job_id}`).emit('schema:ready', event);
        this.server.to(`tenant:${event.tenant_id}`).emit('schema:ready', event);
    }
};
exports.SchemaGateway = SchemaGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SchemaGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:job'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SchemaGateway.prototype, "handleJoinJob", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:tenant'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SchemaGateway.prototype, "handleJoinTenant", null);
exports.SchemaGateway = SchemaGateway = SchemaGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ISchemaEventSubscriber')),
    __metadata("design:paramtypes", [Object])
], SchemaGateway);
