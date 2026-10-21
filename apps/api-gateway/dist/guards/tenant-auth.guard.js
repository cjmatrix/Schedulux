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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let TenantAuthGuard = class TenantAuthGuard {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const tenantToken = request.cookies?.access_token;
        const dashboardToken = request.cookies?.dashboarduser_access_token;
        const token = tenantToken || dashboardToken;
        if (!token) {
            throw new common_1.UnauthorizedException('Authentication token missing');
        }
        try {
            const secret = this.configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (!decoded || !decoded.tenant_id) {
                throw new common_1.UnauthorizedException('Invalid token structure');
            }
            if (decoded.role === 'tenant_owner') {
                request.tenant = decoded;
            }
            else if (decoded.role === 'root' ||
                decoded.role === 'manager' ||
                decoded.role === 'dashboard_user') {
                request.dashboardUser = decoded;
            }
            else {
                throw new common_1.UnauthorizedException('Unrecognized user role');
            }
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException) {
                throw err;
            }
            throw new common_1.UnauthorizedException('Invalid or expired authentication token');
        }
    }
};
exports.TenantAuthGuard = TenantAuthGuard;
exports.TenantAuthGuard = TenantAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TenantAuthGuard);
