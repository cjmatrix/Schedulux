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
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const redis_service_js_1 = require("../services/redis.service.js");
let SchemaGateway = SchemaGateway_1 = class SchemaGateway {
    redisService;
    server;
    logger = new common_1.Logger(SchemaGateway_1.name);
    constructor(redisService) {
        this.redisService = redisService;
    }
    onModuleInit() {
        this.redisService.onSchemaGenerated((event) => {
            this.handleSchemaGenerated(event);
        });
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinJob(client, data) {
        if (data?.job_id) {
            const room = `job:${data.job_id}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined room ${room}`);
            return { status: 'joined', room };
        }
        return { status: 'error', message: 'Missing job_id' };
    }
    handleJoinTenant(client, data) {
        if (data?.tenant_id) {
            const room = `tenant:${data.tenant_id}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined room ${room}`);
            return { status: 'joined', room };
        }
        return { status: 'error', message: 'Missing tenant_id' };
    }
    handleSchemaGenerated(event) {
        this.logger.log(`Broadcasting schema:ready for job ${event.job_id} / tenant ${event.tenant_id}`);
        // Emit to specific job room
        this.server.to(`job:${event.job_id}`).emit('schema:ready', event);
        // Emit to tenant room
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
    __metadata("design:paramtypes", [redis_service_js_1.RedisService])
], SchemaGateway);
