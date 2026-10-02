"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardUserLoginDto = exports.DashboardUserLoginSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.DashboardUserLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Please provide a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class DashboardUserLoginDto extends (0, nestjs_zod_1.createZodDto)(exports.DashboardUserLoginSchema) {
}
exports.DashboardUserLoginDto = DashboardUserLoginDto;
