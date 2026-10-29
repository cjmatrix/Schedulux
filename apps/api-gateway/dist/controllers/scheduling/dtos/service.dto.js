"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListServicesQueryDto = exports.ListServicesQuerySchema = exports.UpdateServiceDto = exports.UpdateServiceDtoSchema = exports.CreateServiceDto = exports.CreateServiceDtoSchema = exports.ResourceRequirementDto = exports.ResourceRequirementDtoSchema = exports.ServiceVerificationDtoSchema = exports.DepositDtoSchema = exports.PriceDtoSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.PriceDtoSchema = zod_1.z.object({
    type: zod_1.z.enum(['fixed', 'starting_at', 'hourly', 'free', 'custom']).default('fixed'),
    amount: zod_1.z.number().nonnegative().default(0),
    currency: zod_1.z.string().default('USD'),
});
exports.DepositDtoSchema = zod_1.z.object({
    required: zod_1.z.boolean().default(false),
    amount: zod_1.z.number().nonnegative().default(0),
    processor: zod_1.z.string().optional().default(''),
    upi_id: zod_1.z.string().optional().default(''),
    qr_code_url: zod_1.z.string().optional().default(''),
    confirmation_method: zod_1.z.string().optional().default('automatic'),
    payment_instructions: zod_1.z.string().optional().default(''),
});
exports.ServiceVerificationDtoSchema = zod_1.z.object({
    require_otp: zod_1.z.boolean().nullable().optional(),
});
exports.ResourceRequirementDtoSchema = zod_1.z.object({
    role: zod_1.z.string().default('Staff'),
    resource_type: zod_1.z.string().default('staff'),
    count: zod_1.z.number().int().min(1).default(1),
    eligible_resource_ids: zod_1.z.array(zod_1.z.string()).default([]),
    selection_mode: zod_1.z.enum(['user_selectable', 'auto_assign']).optional().default('auto_assign'),
});
class ResourceRequirementDto extends (0, nestjs_zod_1.createZodDto)(exports.ResourceRequirementDtoSchema) {
}
exports.ResourceRequirementDto = ResourceRequirementDto;
exports.CreateServiceDtoSchema = zod_1.z.object({
    agent_id: zod_1.z.string().min(1, 'agent_id is required'),
    name: zod_1.z.string().min(1, 'Service name is required').trim(),
    category: zod_1.z.string().optional().default('General'),
    description: zod_1.z.string().optional().default(''),
    duration_minutes: zod_1.z.number().int().min(1, 'Duration must be at least 1 minute').default(30),
    buffer_minutes: zod_1.z.number().int().min(0).default(0),
    booking_mode: zod_1.z.enum(['time_slot', 'date_range']).default('time_slot'),
    price: exports.PriceDtoSchema.optional().default({ type: 'fixed', amount: 0, currency: 'USD' }),
    deposit: exports.DepositDtoSchema.optional().default({
        required: false,
        amount: 0,
        processor: '',
        upi_id: '',
        qr_code_url: '',
        confirmation_method: 'automatic',
        payment_instructions: '',
    }),
    verification: exports.ServiceVerificationDtoSchema.optional(),
    resource_requirements: zod_1.z.array(exports.ResourceRequirementDtoSchema).optional().default([]),
    recall_interval_days: zod_1.z.number().int().min(0).optional().default(0),
});
class CreateServiceDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateServiceDtoSchema) {
}
exports.CreateServiceDto = CreateServiceDto;
exports.UpdateServiceDtoSchema = zod_1.z.object({
    agent_id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).trim().optional(),
    category: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    duration_minutes: zod_1.z.number().int().min(1).optional(),
    buffer_minutes: zod_1.z.number().int().min(0).optional(),
    booking_mode: zod_1.z.enum(['time_slot', 'date_range']).optional(),
    price: exports.PriceDtoSchema.optional(),
    deposit: exports.DepositDtoSchema.optional(),
    verification: exports.ServiceVerificationDtoSchema.optional(),
    resource_requirements: zod_1.z.array(exports.ResourceRequirementDtoSchema).optional(),
    recall_interval_days: zod_1.z.number().int().min(0).optional(),
});
class UpdateServiceDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateServiceDtoSchema) {
}
exports.UpdateServiceDto = UpdateServiceDto;
exports.ListServicesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    category: zod_1.z.string().optional(),
    agent_id: zod_1.z.string().min(1, 'agent_id is required'),
    search: zod_1.z.string().optional(),
});
class ListServicesQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.ListServicesQuerySchema) {
}
exports.ListServicesQueryDto = ListServicesQueryDto;
