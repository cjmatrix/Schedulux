import { CustomerEntity } from '../entities/customer.entity.js';

export interface FindCustomersFilter {
  page: number;
  limit: number;
  search?: string;
  agentId?: string;
}

export interface ICustomerRepository {
  create(customer: CustomerEntity): Promise<CustomerEntity>;
  findById(tenantId: string, customerId: string, agentId?: string): Promise<CustomerEntity | null>;
  findByPhone(tenantId: string, phone: string, agentId?: string): Promise<CustomerEntity | null>;
  findByEmail(tenantId: string, email: string, agentId?: string): Promise<CustomerEntity | null>;
  update(customer: CustomerEntity): Promise<CustomerEntity | null>;
  findAll(
    tenantId: string,
    filter: FindCustomersFilter,
  ): Promise<{
    customers: CustomerEntity[];
    total: number;
  }>;
}
