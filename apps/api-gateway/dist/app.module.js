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
const microservices_1 = require("@nestjs/microservices");
const path_1 = require("path");
const tenant_controller_js_1 = require("./tenant/tenant.controller.js");
const superadmin_controller_js_1 = require("./superadmin/superadmin.controller.js");
const superadmin_auth_middleware_js_1 = require("./middleware/superadmin-auth.middleware.js");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(superadmin_auth_middleware_js_1.SuperAdminAuthMiddleware)
            .forRoutes({ path: 'api/v1/superadmin/auth/me', method: common_1.RequestMethod.GET });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.register([
                {
                    name: 'TENANT_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50051',
                        package: 'tenant',
                        protoPath: (0, path_1.join)(process.cwd(), 'src/grpc/proto/tenant.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        }
                    },
                },
                {
                    name: 'SUPERADMIN_PACKAGE',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        url: 'localhost:50051',
                        package: 'superadmin',
                        protoPath: (0, path_1.join)(process.cwd(), 'src/grpc/proto/superadmin.proto'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        }
                    },
                },
            ]),
        ],
        controllers: [tenant_controller_js_1.TenantController, superadmin_controller_js_1.SuperAdminController],
        providers: [superadmin_auth_middleware_js_1.SuperAdminAuthMiddleware],
    })
], AppModule);
