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
exports.SuperAdminAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookies_constant_js_1 = require("../constants/cookies.constant.js");
const messages_constant_js_1 = require("../constants/messages.constant.js");
let SuperAdminAuthGuard = class SuperAdminAuthGuard {
    _configService;
    constructor(_configService) {
        this._configService = _configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.[cookies_constant_js_1.COOKIE_NAMES.SUPERADMIN_ACCESS_TOKEN];
        if (!token) {
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.SUPERADMIN_TOKEN_MISSING);
        }
        try {
            const globalSecret = this._configService.get('JWT_SECRET');
            const secret = this._configService.get('SUPERADMIN_JWT_SECRET') ||
                (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (!decoded || decoded.role !== 'super_admin') {
                throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.SUPERADMIN_FORBIDDEN);
            }
            request.superAdmin = decoded;
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException) {
                throw err;
            }
            throw new common_1.UnauthorizedException(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.INVALID_SUPERADMIN_TOKEN);
        }
    }
};
exports.SuperAdminAuthGuard = SuperAdminAuthGuard;
exports.SuperAdminAuthGuard = SuperAdminAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SuperAdminAuthGuard);
