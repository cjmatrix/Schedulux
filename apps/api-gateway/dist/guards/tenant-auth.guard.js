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
const rxjs_1 = require("rxjs");
const cookies_constant_js_1 = require("../constants/cookies.constant.js");
const messages_constant_js_1 = require("../constants/messages.constant.js");
const redis_service_js_1 = require("../services/redis.service.js");
let TenantAuthGuard = class TenantAuthGuard {
    _configService;
    _redisService;
    _client;
    _dashboardClient;
    _tenantService;
    _dashboardAuthService;
    constructor(_configService, _redisService, _client, _dashboardClient) {
        this._configService = _configService;
        this._redisService = _redisService;
        this._client = _client;
        this._dashboardClient = _dashboardClient;
    }
    onModuleInit() {
        this._tenantService = this._client.getService('TenantService');
        this._dashboardAuthService =
            this._dashboardClient.getService('DashboardAuthService');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const tenantToken = request.cookies?.[cookies_constant_js_1.COOKIE_NAMES.TENANT_ACCESS_TOKEN];
        const dashboardToken = request.cookies?.[cookies_constant_js_1.COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN];
        const isDashboardEndpoint = request.url?.includes('/dashboard-user/');
        const isTenantAuthEndpoint = request.url?.includes('/tenant/auth/');
        let token;
        if (isDashboardEndpoint) {
            token = dashboardToken;
        }
        else if (isTenantAuthEndpoint) {
            token = tenantToken;
        }
        else {
            token = tenantToken || dashboardToken;
        }
        if (!token) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.TOKEN_MISSING);
        }
        try {
            const secret = this._configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (!decoded || !decoded.tenant_id) {
                throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.INVALID_TOKEN_STRUCTURE);
            }
            let status = await this._redisService.getTenantStatus(decoded.tenant_id);
            if (!status) {
                try {
                    const tenantResp = await (0, rxjs_1.lastValueFrom)(this._tenantService.getTenantById({
                        tenant_id: decoded.tenant_id,
                    }));
                    status = tenantResp?.tenant?.status || 'active';
                    await this._redisService.setTenantStatus(decoded.tenant_id, status);
                }
                catch {
                    status = 'active';
                }
            }
            if (status === 'suspended') {
                throw new common_1.ForbiddenException('Tenant account is suspended. Please contact support.');
            }
            let tier = await this._redisService.getTenantTier(decoded.tenant_id);
            if (!tier) {
                tier = decoded.tier || 'starter';
                await this._redisService.setTenantTier(decoded.tenant_id, tier).catch(() => { });
            }
            decoded.tier = tier;
            if (decoded.role === 'tenant_owner') {
                request.tenant = decoded;
            }
            else if (decoded.role === 'manager') {
                const userId = decoded.user_id || decoded.sub;
                if (userId) {
                    let userStatus = await this._redisService.getDashboardUserStatus(userId);
                    if (!userStatus) {
                        try {
                            const profile = await (0, rxjs_1.lastValueFrom)(this._dashboardAuthService.getProfile({ user_id: userId }));
                            userStatus = profile?.user?.status || 'active';
                            await this._redisService.setDashboardUserStatus(userId, userStatus);
                        }
                        catch {
                            userStatus = 'active';
                        }
                    }
                    if (userStatus === 'suspended') {
                        throw new common_1.ForbiddenException('Your account has been suspended. Please contact your workspace administrator.');
                    }
                }
                request.dashboardUser = decoded;
            }
            else {
                throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.UNRECOGNIZED_ROLE);
            }
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
        }
    }
};
exports.TenantAuthGuard = TenantAuthGuard;
exports.TenantAuthGuard = TenantAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __param(1, (0, common_1.Inject)(redis_service_js_1.RedisService)),
    __param(2, (0, common_1.Inject)('TENANT_PACKAGE')),
    __param(3, (0, common_1.Inject)('DASHBOARD_PACKAGE')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_js_1.RedisService, Object, Object])
], TenantAuthGuard);
