"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteUserDto = exports.InviteUserSchema = exports.TenantLoginDto = exports.TenantLoginSchema = exports.TenantRegisterDto = exports.TenantRegisterSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
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
exports.InviteUserSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters'),
    system_role: zod_1.z.string().min(1, 'System role is required'),
});
class InviteUserDto extends (0, nestjs_zod_1.createZodDto)(exports.InviteUserSchema) {
}
exports.InviteUserDto = InviteUserDto;
