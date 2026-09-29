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
import { BaseRepository } from './BaseRepository.js';
import { Tenent } from '../model/Tenent.js';
let TenantRepository = class TenantRepository extends BaseRepository {
    constructor() {
        super(Tenent);
    }
    async findByTenantId(tenantId) {
        return this.findById(tenantId);
    }
    async findByEmail(email) {
        return this.findOne({ contact_email: email });
    }
    async updateStatus(tenantId, status) {
        return this.update(tenantId, { status });
    }
};
TenantRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], TenantRepository);
export { TenantRepository };
