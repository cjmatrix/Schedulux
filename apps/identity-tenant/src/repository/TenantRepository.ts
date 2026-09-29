import { Injectable } from '@nestjs/common';
import { BaseRepository } from './BaseRepository.js'
import { ITenantRepository } from '../interfaces/ITenantRepository.js'
import { ITenant, Tenent } from '../model/Tenent.js'

@Injectable()
export class TenantRepository extends BaseRepository<ITenant> implements ITenantRepository {

  constructor() {
    super(Tenent)
  }

  async findByTenantId(tenantId: string): Promise<ITenant | null> {
    return this.findById(tenantId)
  }

  async findByEmail(email: string): Promise<ITenant | null> {
    return this.findOne({ contact_email: email })
  }

  async updateStatus(tenantId: string, status: string): Promise<ITenant | null> {
    return this.update(tenantId, { status })
  }
}
