"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspendTenantParamDto = exports.SuspendTenantParamSchema = exports.ListTenantsDto = exports.ListTenantsSchema = exports.SuperAdminLogoutDto = exports.SuperAdminLogoutSchema = exports.SuperAdminRefreshTokenDto = exports.SuperAdminRefreshTokenSchema = exports.SuperAdminLoginDto = exports.SuperAdminLoginSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.SuperAdminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class SuperAdminLoginDto extends (0, nestjs_zod_1.createZodDto)(exports.SuperAdminLoginSchema) {
}
exports.SuperAdminLoginDto = SuperAdminLoginDto;
exports.SuperAdminRefreshTokenSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().default(''),
});
class SuperAdminRefreshTokenDto extends (0, nestjs_zod_1.createZodDto)(exports.SuperAdminRefreshTokenSchema) {
}
exports.SuperAdminRefreshTokenDto = SuperAdminRefreshTokenDto;
exports.SuperAdminLogoutSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().default(''),
});
class SuperAdminLogoutDto extends (0, nestjs_zod_1.createZodDto)(exports.SuperAdminLogoutSchema) {
}
exports.SuperAdminLogoutDto = SuperAdminLogoutDto;
exports.ListTenantsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().default(1),
    limit: zod_1.z.coerce.number().default(10),
    search: zod_1.z.string().optional(),
    tier: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
class ListTenantsDto extends (0, nestjs_zod_1.createZodDto)(exports.ListTenantsSchema) {
}
exports.ListTenantsDto = ListTenantsDto;
exports.SuspendTenantParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Tenant ID is required'),
});
class SuspendTenantParamDto extends (0, nestjs_zod_1.createZodDto)(exports.SuspendTenantParamSchema) {
}
exports.SuspendTenantParamDto = SuspendTenantParamDto;
