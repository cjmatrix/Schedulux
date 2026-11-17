"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const knowledge_controller_js_1 = require("./controllers/agentOrchestrator/knowledge.controller.js");
const billing_controller_js_1 = require("./controllers/billing/billing.controller.js");
const dashboard_user_auth_controller_js_1 = require("./controllers/dashboarduser/dashboard-user-auth.controller.js");
const scheduling_controller_js_1 = require("./controllers/scheduling/scheduling.controller.js");
const superadmin_controller_js_1 = require("./controllers/superadmin/superadmin.controller.js");
const superadmin_dashboard_controller_js_1 = require("./controllers/superadmin/superadmin-dashboard.controller.js");
const superadmin_tenant_controller_js_1 = require("./controllers/superadmin/superadmin-tenant.controller.js");
const superadmin_tier_config_controller_js_1 = require("./controllers/superadmin/superadmin-tier-config.controller.js");
const tenant_controller_js_1 = require("./controllers/tenant/tenant.controller.js");
const tenant_dashboard_controller_js_1 = require("./controllers/tenant/tenant-dashboard.controller.js");
const app_throttler_guard_js_1 = require("./guards/app-throttler.guard.js");
const paddle_webhook_guard_js_1 = require("./guards/paddle-webhook.guard.js");
const roles_guard_js_1 = require("./guards/roles.guard.js");
const tenant_auth_guard_js_1 = require("./guards/tenant-auth.guard.js");
const redis_module_js_1 = require("./modules/redis.module.js");
const throttler_storage_redis_service_js_1 = require("./services/throttler-storage-redis.service.js");
const schema_gateway_js_1 = require("./websockets/schema.gateway.js");
const isProduction = process.env.NODE_ENV === 'production';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    name: 'api-gateway',
                    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
                    transport: isProduction
                        ? undefined
                        : {
                            target: require.resolve('pino-pretty'),
                            options: {
                                colorize: true,
                                translateTime: 'SYS:standard',
                                ignore: 'pid,hostname',
                            },
                        },
                },
            }),
            redis_module_js_1.RedisModule,
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [redis_module_js_1.RedisModule],
                inject: [throttler_storage_redis_service_js_1.ThrottlerStorageRedisService],
                useFactory: (storage) => ({
                    throttlers: [
                        {
                            name: 'short',
                            ttl: 1000,
                            limit: 30,
                        },
                        {
                            name: 'default',
                            ttl: 60000,
                            limit: 100,
                        },
                        {
                            name: 'long',
                            ttl: 900000,
                            limit: 1000,
                        },
                    ],
                    storage,
                    errorMessage: (_context, detail) => `Rate limit of ${detail.limit} requests exceeded. Please try again in ${detail.timeToBlockExpire} seconds.`,
                }),
            }),
            microservices_1.ClientsModule.register([
                {
                    name: 'TENANT_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50051',
                        package: 'tenant',
                        protoPath: require.resolve('@repo/proto/tenant.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        },
                    },
                },
                {
                    name: 'DASHBOARD_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50051',
                        package: 'dashboard',
                        protoPath: require.resolve('@repo/proto/dashboard.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        },
                    },
                },
                {
                    name: 'SUPERADMIN_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50051',
                        package: 'superadmin',
                        protoPath: require.resolve('@repo/proto/superadmin.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        },
                    },
                },
                {
                    name: 'KNOWLEDGE_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50052',
                        package: 'knowledge',
                        protoPath: require.resolve('@repo/proto/knowledge.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        },
                    },
                },
                {
                    name: 'SCHEDULING_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50053',
                        package: 'scheduling',
                        protoPath: require.resolve('@repo/proto/scheduling.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        },
                    },
                },
            ]),
        ],
        controllers: [
            tenant_controller_js_1.TenantController,
            tenant_dashboard_controller_js_1.TenantDashboardController,
            billing_controller_js_1.BillingController,
            superadmin_controller_js_1.SuperAdminController,
            superadmin_dashboard_controller_js_1.SuperAdminDashboardController,
            superadmin_tenant_controller_js_1.SuperAdminTenantController,
            superadmin_tier_config_controller_js_1.SuperAdminTierConfigController,
            dashboard_user_auth_controller_js_1.DashboardUserAuthController,
            knowledge_controller_js_1.KnowledgeController,
            scheduling_controller_js_1.SchedulingController,
        ],
        providers: [
            schema_gateway_js_1.SchemaGateway,
            roles_guard_js_1.RolesGuard,
            tenant_auth_guard_js_1.TenantAuthGuard,
            paddle_webhook_guard_js_1.PaddleWebhookGuard,
            {
                provide: core_1.APP_GUARD,
                useClass: app_throttler_guard_js_1.AppThrottlerGuard,
            },
        ],
    })
], AppModule);
