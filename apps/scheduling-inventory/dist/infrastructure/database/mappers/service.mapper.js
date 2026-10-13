import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
export class ServiceMapper {
    static toDomain(doc) {
        return new ServiceEntity({
            id: doc._id,
            tenantId: doc.tenant_id,
            name: doc.name,
            category: doc.category,
            description: doc.description,
            durationMinutes: doc.duration_minutes,
            bufferMinutes: doc.buffer_minutes,
            allocationModel: doc.allocation_model,
            price: PriceVO.create(doc.price?.type, doc.price?.amount, doc.price?.currency),
            deposit: DepositVO.create({
                required: doc.deposit?.required,
                amount: doc.deposit?.amount,
                processor: doc.deposit?.processor,
                upiId: doc.deposit?.upi_id,
                qrCodeUrl: doc.deposit?.qr_code_url,
                confirmationMethod: doc.deposit?.confirmation_method,
                paymentInstructions: doc.deposit?.payment_instructions,
            }),
            eligibleResourceIds: doc.eligible_resource_ids ?? [],
            requiredAssetIds: doc.required_asset_ids ?? [],
            recallIntervalDays: doc.recall_interval_days ?? 0,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at,
        });
    }
    static toPersistence(entity) {
        return {
            _id: entity.id,
            tenant_id: entity.tenantId,
            name: entity.name,
            category: entity.category,
            description: entity.description,
            duration_minutes: entity.durationMinutes,
            buffer_minutes: entity.bufferMinutes,
            allocation_model: entity.allocationModel,
            price: {
                type: entity.price.type,
                amount: entity.price.amount,
                currency: entity.price.currency,
            },
            deposit: {
                required: entity.deposit.required,
                amount: entity.deposit.amount,
                processor: entity.deposit.processor,
                upi_id: entity.deposit.upiId,
                qr_code_url: entity.deposit.qrCodeUrl,
                confirmation_method: entity.deposit.confirmationMethod,
                payment_instructions: entity.deposit.paymentInstructions,
            },
            eligible_resource_ids: entity.eligibleResourceIds,
            required_asset_ids: entity.requiredAssetIds,
            recall_interval_days: entity.recallIntervalDays,
        };
    }
    static toProto(entity) {
        return {
            service_id: entity.id,
            tenant_id: entity.tenantId,
            name: entity.name,
            category: entity.category,
            description: entity.description,
            duration_minutes: entity.durationMinutes,
            buffer_minutes: entity.bufferMinutes,
            allocation_model: entity.allocationModel,
            price: {
                type: entity.price.type,
                amount: entity.price.amount,
                currency: entity.price.currency,
            },
            deposit: {
                required: entity.deposit.required,
                amount: entity.deposit.amount,
                processor: entity.deposit.processor,
                upi_id: entity.deposit.upiId,
                qr_code_url: entity.deposit.qrCodeUrl,
                confirmation_method: entity.deposit.confirmationMethod,
                payment_instructions: entity.deposit.paymentInstructions,
            },
            eligible_resource_ids: entity.eligibleResourceIds,
            required_asset_ids: entity.requiredAssetIds,
            recall_interval_days: entity.recallIntervalDays,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
