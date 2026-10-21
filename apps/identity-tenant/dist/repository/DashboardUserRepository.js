var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { DashboardUser } from '../model/DashboardUser.js';
import { BaseRepository } from './BaseRepository.js';
let DashboardUserRepository = class DashboardUserRepository extends BaseRepository {
    constructor() {
        super(DashboardUser);
    }
    async findByEmail(email) {
        return this.model.findOne({ email }).exec();
    }
    async findByTenantId(tenantId) {
        return this.model.find({ tenant_id: tenantId }).select('-password_hash').exec();
    }
    async findWorkspaceUsers(options) {
        const { tenantId, page = 1, limit = 10, search, role } = options;
        const query = { tenant_id: tenantId };
        if (search?.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [{ name: regex }, { email: regex }];
        }
        if (role && role !== 'all') {
            const mappedRole = role === 'owner' ? 'root' : role;
            query.system_role = mappedRole;
        }
        const skip = (page - 1) * limit;
        const [users, total_count] = await Promise.all([
            this.model.find(query).select('-password_hash').skip(skip).limit(limit).exec(),
            this.model.countDocuments(query).exec(),
        ]);
        return { users, total_count };
    }
    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    }
};
DashboardUserRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], DashboardUserRepository);
export { DashboardUserRepository };
