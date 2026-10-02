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
const microservices_1 = require("@nestjs/microservices");
const tenant_controller_js_1 = require("./controllers/tenant/tenant.controller.js");
const superadmin_controller_js_1 = require("./controllers/superadmin/superadmin.controller.js");
const superadmin_tenant_controller_js_1 = require("./controllers/superadmin/superadmin-tenant.controller.js");
const dashboard_user_auth_controller_js_1 = require("./controllers/dashboarduser/dashboard-user-auth.controller.js");
const knowledge_controller_js_1 = require("./controllers/knowledge/knowledge.controller.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            microservices_1.ClientsModule.register([
                {
                    name: "TENANT_PACKAGE",
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: "localhost:50051",
                        package: "tenant",
                        protoPath: require.resolve("@repo/proto/tenant.proto"),
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
                    name: "DASHBOARD_PACKAGE",
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: "localhost:50051",
                        package: "dashboard",
                        protoPath: require.resolve("@repo/proto/dashboard.proto"),
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
                    name: "SUPERADMIN_PACKAGE",
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: "localhost:50051",
                        package: "superadmin",
                        protoPath: require.resolve("@repo/proto/superadmin.proto"),
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
                    name: "KNOWLEDGE_PACKAGE",
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: "localhost:50051",
                        package: "knowledge",
                        protoPath: require.resolve("@repo/proto/knowledge.proto"),
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
            superadmin_controller_js_1.SuperAdminController,
            superadmin_tenant_controller_js_1.SuperAdminTenantController,
            dashboard_user_auth_controller_js_1.DashboardUserAuthController,
            knowledge_controller_js_1.KnowledgeController,
        ],
        providers: [],
    })
], AppModule);
