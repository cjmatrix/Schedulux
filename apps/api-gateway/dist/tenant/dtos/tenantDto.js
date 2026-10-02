"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantLoginDto = exports.TenantLoginSchema = exports.TenantRegisterDto = exports.TenantRegisterSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.TenantRegisterSchema = zod_1.z.object({
    business_name: zod_1.z.string().trim().min(1, 'Business name is required'),
    full_name: zod_1.z.string().trim().min(1, 'Full name is required'),
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
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
