"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDto = exports.ResetPasswordSchema = exports.ForgotPasswordDto = exports.ForgotPasswordSchema = exports.ListWorkspaceUsersDto = exports.ListWorkspaceUsersSchema = exports.InviteUserDto = exports.InviteUserSchema = exports.LogoutDto = exports.LogoutSchema = exports.RefreshTokenDto = exports.RefreshTokenSchema = exports.VerifyEmailDto = exports.VerifyEmailSchema = exports.TenantLoginDto = exports.TenantLoginSchema = exports.TenantRegisterDto = exports.TenantRegisterSchema = exports.TenantGoogleLoginDto = exports.TenantGoogleLoginSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.TenantGoogleLoginSchema = zod_1.z.object({
    id_token: zod_1.z.string().min(1, 'Google ID token is required'),
});
class TenantGoogleLoginDto extends (0, nestjs_zod_1.createZodDto)(exports.TenantGoogleLoginSchema) {
}
exports.TenantGoogleLoginDto = TenantGoogleLoginDto;
exports.TenantRegisterSchema = zod_1.z.object({
    business_name: zod_1.z.string().trim().min(2, 'Business name must be at least 2 characters'),
    full_name: zod_1.z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
class TenantRegisterDto extends (0, nestjs_zod_1.createZodDto)(exports.TenantRegisterSchema) {
}
exports.TenantRegisterDto = TenantRegisterDto;
exports.TenantLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class TenantLoginDto extends (0, nestjs_zod_1.createZodDto)(exports.TenantLoginSchema) {
}
exports.TenantLoginDto = TenantLoginDto;
exports.VerifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
});
class VerifyEmailDto extends (0, nestjs_zod_1.createZodDto)(exports.VerifyEmailSchema) {
}
exports.VerifyEmailDto = VerifyEmailDto;
exports.RefreshTokenSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().default(''),
});
class RefreshTokenDto extends (0, nestjs_zod_1.createZodDto)(exports.RefreshTokenSchema) {
}
exports.RefreshTokenDto = RefreshTokenDto;
exports.LogoutSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().default(''),
});
class LogoutDto extends (0, nestjs_zod_1.createZodDto)(exports.LogoutSchema) {
}
exports.LogoutDto = LogoutDto;
exports.InviteUserSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters'),
    system_role: zod_1.z.string().min(1, 'System role is required'),
});
class InviteUserDto extends (0, nestjs_zod_1.createZodDto)(exports.InviteUserSchema) {
}
exports.InviteUserDto = InviteUserDto;
exports.ListWorkspaceUsersSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    page: zod_1.z.coerce.number().optional(),
    limit: zod_1.z.coerce.number().optional(),
    search: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
});
class ListWorkspaceUsersDto extends (0, nestjs_zod_1.createZodDto)(exports.ListWorkspaceUsersSchema) {
}
exports.ListWorkspaceUsersDto = ListWorkspaceUsersDto;
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
});
class ForgotPasswordDto extends (0, nestjs_zod_1.createZodDto)(exports.ForgotPasswordSchema) {
}
exports.ForgotPasswordDto = ForgotPasswordDto;
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    new_password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
class ResetPasswordDto extends (0, nestjs_zod_1.createZodDto)(exports.ResetPasswordSchema) {
}
exports.ResetPasswordDto = ResetPasswordDto;
