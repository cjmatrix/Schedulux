import { ITenant } from '../model/Tenent.js'


interface InputData {
  _id?: string;
  business_name: string;
  contact_email: string;
  password_hash: string;
  tier: string;
  status: string;
}


export interface ITenantRepository {
  create(data: InputData): Promise<ITenant>
  findById(id: string): Promise<ITenant | null>
  findByTenantId(tenantId: string): Promise<ITenant | null>
  findByEmail(email: string): Promise<ITenant | null>
  updateStatus(tenantId: string, status: string): Promise<ITenant | null>
}
