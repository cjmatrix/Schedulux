"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResourcesQueryDto = exports.ListResourcesQuerySchema = exports.UpdateResourceDto = exports.UpdateResourceDtoSchema = exports.CreateResourceDto = exports.CreateResourceDtoSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.CreateResourceDtoSchema = zod_1.z.object({
    agent_id: zod_1.z.string().min(1, 'agent_id is required'),
    resource_type: zod_1.z.enum(['staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle']).default('staff'),
    name: zod_1.z.string().min(1, 'Resource name is required').trim(),
    title: zod_1.z.string().optional().default(''),
    category: zod_1.z.string().optional().default('General'),
    description: zod_1.z.string().optional().default(''),
    is_bookable: zod_1.z.boolean().optional().default(true),
    dispatch_status: zod_1.z.enum(['active', 'on_leave', 'maintenance', 'retired', 'inactive']).default('active'),
    custom_shift_overrides_json: zod_1.z.string().optional().default('{}'),
});
class CreateResourceDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateResourceDtoSchema) {
}
exports.CreateResourceDto = CreateResourceDto;
exports.UpdateResourceDtoSchema = zod_1.z.object({
    agent_id: zod_1.z.string().optional(),
    resource_type: zod_1.z.enum(['staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle']).optional(),
    name: zod_1.z.string().min(1).trim().optional(),
    title: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    is_bookable: zod_1.z.boolean().optional(),
    dispatch_status: zod_1.z.enum(['active', 'on_leave', 'maintenance', 'retired', 'inactive']).optional(),
    custom_shift_overrides_json: zod_1.z.string().optional(),
});
class UpdateResourceDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateResourceDtoSchema) {
}
exports.UpdateResourceDto = UpdateResourceDto;
exports.ListResourcesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    resource_type: zod_1.z.string().optional(),
    dispatch_status: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
class ListResourcesQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.ListResourcesQuerySchema) {
}
exports.ListResourcesQueryDto = ListResourcesQueryDto;
