import { Inject, Injectable } from '@nestjs/common';
import { CustomerEntity } from '../../../domain/entities/customer.entity.js';
import {
  FindCustomersFilter,
  ICustomerRepository,
} from '../../../domain/repositories/customer.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import { UNIT_OF_WORK } from '../../../domain/tokens.js';
import { CustomerMapper } from '../mappers/customer.mapper.js';
import { CustomerModel } from '../schemas/customer.schema.js';

@Injectable()
export class MongoCustomerRepository implements ICustomerRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async create(customer: CustomerEntity): Promise<CustomerEntity> {
    const session = this._unitOfWork?.getSession();
    const persistenceData = CustomerMapper.toPersistence(customer);
    if (session) {
      const [created] = await CustomerModel.create([persistenceData], { session });
      return CustomerMapper.toDomain(created);
    }
    const created = await CustomerModel.create(persistenceData);
    return CustomerMapper.toDomain(created);
  }

  async findById(
    tenantId: string,
    customerId: string,
    agentId?: string,
  ): Promise<CustomerEntity | null> {
    const query: Record<string, unknown> = {
      _id: customerId,
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (agentId) {
      query.agent_id = agentId;
    }
    const doc = await CustomerModel.findOne(query).exec();
    if (!doc) return null;
    return CustomerMapper.toDomain(doc);
  }

  async findByPhone(
    tenantId: string,
    phone: string,
    agentId?: string,
  ): Promise<CustomerEntity | null> {
    const cleanPhone = phone.trim();
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      phone: cleanPhone,
      is_deleted: { $ne: true },
    };
    if (agentId) {
      query.agent_id = agentId;
    }
    const doc = await CustomerModel.findOne(query).exec();
    if (!doc) return null;
    return CustomerMapper.toDomain(doc);
  }

  async findByEmail(
    tenantId: string,
    email: string,
    agentId?: string,
  ): Promise<CustomerEntity | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      email: cleanEmail,
      is_deleted: { $ne: true },
    };
    if (agentId) {
      query.agent_id = agentId;
    }
    const doc = await CustomerModel.findOne(query).exec();
    if (!doc) return null;
    return CustomerMapper.toDomain(doc);
  }

  async update(customer: CustomerEntity): Promise<CustomerEntity | null> {
    const session = this._unitOfWork?.getSession();
    const persistenceData = CustomerMapper.toPersistence(customer);

    const filter: Record<string, unknown> = {
      _id: customer.id,
      tenant_id: customer.tenantId,
      is_deleted: { $ne: true },
    };
    if (customer.agentId) {
      filter.agent_id = customer.agentId;
    }

    const doc = await CustomerModel.findOneAndUpdate(
      filter,
      { $set: persistenceData },
      { new: true, session },
    ).exec();

    if (!doc) return null;
    return CustomerMapper.toDomain(doc);
  }

  async findAll(
    tenantId: string,
    filter: FindCustomersFilter,
  ): Promise<{ customers: CustomerEntity[]; total: number }> {
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };

    if (filter.agentId) {
      query.agent_id = filter.agentId;
    }

    if (filter.search?.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      query.$or = [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }];
    }

    const skip = Math.max(0, (filter.page - 1) * filter.limit);
    const [docs, total] = await Promise.all([
      CustomerModel.find(query).sort({ created_at: -1 }).skip(skip).limit(filter.limit).exec(),
      CustomerModel.countDocuments(query).exec(),
    ]);

    return {
      customers: docs.map((doc) => CustomerMapper.toDomain(doc)),
      total,
    };
  }
}
