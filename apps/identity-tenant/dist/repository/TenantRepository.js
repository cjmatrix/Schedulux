var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./BaseRepository.js";
import { Tenent } from "../model/Tenent.js";
let TenantRepository = class TenantRepository extends BaseRepository {
    constructor() {
        super(Tenent);
    }
    async findByTenantId(tenantId) {
        return this.model.findById(tenantId);
    }
    async findByEmail(email) {
        return this.findOne({ contact_email: email });
    }
    async updateStatus(tenantId, status) {
        const tenant = await this.findByTenantId(tenantId);
        if (!tenant)
            return null;
        tenant.status = status;
        return tenant.save();
    }
    async ListUserByDate(date) {
        const tenants = await this.find({
            createdAt: { $eq: `${date}` }
        });
        return tenants;
    }
    async listTenants(data) {
        const page = Math.max(1, data.page);
        const limit = Math.max(1, Math.min(data.limit, 100));
        const skip = (page - 1) * limit;
        const query = {};
        if (data.status && data.status.toLowerCase() !== 'all') {
            query.status = data.status.toLowerCase();
        }
        if (data.tier && data.tier.toLowerCase() !== 'all tiers') {
            query.tier = data.tier.toLowerCase();
        }
        if (data.search) {
            query.$or = [
                { business_name: { $regex: data.search, $options: 'i' } },
                { contact_email: { $regex: data.search, $options: 'i' } },
                { tenant_id: { $regex: data.search, $options: 'i' } },
            ];
        }
        const [docs, totalCount] = await Promise.all([
            this.model
                .find(query)
                .skip(skip)
                .limit(limit)
                .select("-password_hash")
                .exec(),
            this.model.countDocuments(query).exec(),
        ]);
        const tenants = docs.map((t) => ({
            tenant_id: (t.tenant_id || t._id).toString(),
            business_name: t.business_name,
            contact_email: t.contact_email,
            tier: t.tier,
            status: t.status,
        }));
        return { tenants, total_count: totalCount };
    }
};
TenantRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], TenantRepository);
export { TenantRepository };
