"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminLoginDto = exports.SuperAdminLoginSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.SuperAdminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class SuperAdminLoginDto extends (0, nestjs_zod_1.createZodDto)(exports.SuperAdminLoginSchema) {
}
exports.SuperAdminLoginDto = SuperAdminLoginDto;
