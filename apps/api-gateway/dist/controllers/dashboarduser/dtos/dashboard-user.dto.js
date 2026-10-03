"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardUserResetPasswordDto = exports.DashboardUserResetPasswordSchema = exports.DashboardUserForgotPasswordDto = exports.DashboardUserForgotPasswordSchema = exports.DashboardUserRefreshTokenDto = exports.DashboardUserRefreshTokenSchema = exports.DashboardUserLoginDto = exports.DashboardUserLoginSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.DashboardUserLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class DashboardUserLoginDto extends (0, nestjs_zod_1.createZodDto)(exports.DashboardUserLoginSchema) {
}
exports.DashboardUserLoginDto = DashboardUserLoginDto;
exports.DashboardUserRefreshTokenSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().optional(),
});
class DashboardUserRefreshTokenDto extends (0, nestjs_zod_1.createZodDto)(exports.DashboardUserRefreshTokenSchema) {
}
exports.DashboardUserRefreshTokenDto = DashboardUserRefreshTokenDto;
exports.DashboardUserForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
});
class DashboardUserForgotPasswordDto extends (0, nestjs_zod_1.createZodDto)(exports.DashboardUserForgotPasswordSchema) {
}
exports.DashboardUserForgotPasswordDto = DashboardUserForgotPasswordDto;
exports.DashboardUserResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    new_password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
class DashboardUserResetPasswordDto extends (0, nestjs_zod_1.createZodDto)(exports.DashboardUserResetPasswordSchema) {
}
exports.DashboardUserResetPasswordDto = DashboardUserResetPasswordDto;
