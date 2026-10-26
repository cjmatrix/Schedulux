import { DepositVO } from '../value-objects/deposit.vo.js';
import { PriceVO } from '../value-objects/price.vo.js';

export interface ServiceEntityProps {
  id: string;
  tenantId: string;
  agentId: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  bookingMode?: string;
  price: PriceVO;
  deposit: DepositVO;
  verification?: { require_otp?: boolean | null };
  resourceRequirements?: ResourceRequirement[];
  recallIntervalDays: number;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResourceRequirement {
  role: string;
  resourceType: string;
  count: number;
  eligibleResourceIds: string[];
  selectionMode?: 'user_selectable' | 'auto_assign';
}

export class ServiceEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _agentId: string;
  private _name: string;
  private _category: string;
  private _description: string;
  private _durationMinutes: number;
  private _bufferMinutes: number;
  private _bookingMode: string;
  private _price: PriceVO;
  private _deposit: DepositVO;
  private _verification?: { require_otp?: boolean | null };
  private _resourceRequirements: ResourceRequirement[];
  private _recallIntervalDays: number;
  private _isDeleted: boolean;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ServiceEntityProps) {
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID is required for Service');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('Service name cannot be empty');
    }
    if (props.durationMinutes < 1) {
      throw new Error('Service duration must be at least 1 minute');
    }
    if (props.bufferMinutes < 0) {
      throw new Error('Buffer minutes cannot be negative');
    }

    this._id = props.id;
    this._tenantId = props.tenantId;
    this._agentId = props.agentId;
    this._name = props.name.trim();
    this._category = props.category?.trim() ?? 'General';
    this._description = props.description?.trim() ?? '';
    this._durationMinutes = props.durationMinutes;
    this._bufferMinutes = props.bufferMinutes;
    this._bookingMode = props.bookingMode ?? 'time_slot';
    this._price = props.price ?? PriceVO.create();
    this._deposit = props.deposit ?? DepositVO.create();
    this._verification = props.verification;
    this._resourceRequirements = (props.resourceRequirements ?? []).map((r) => ({
      role: r.role?.trim() || 'Staff',
      resourceType: r.resourceType?.trim() || 'staff',
      count: Math.max(1, r.count || 1),
      eligibleResourceIds: [...(r.eligibleResourceIds ?? [])],
    }));
    this._recallIntervalDays = props.recallIntervalDays ?? 0;
    this._isDeleted = props.isDeleted ?? false;
    this._deletedAt = props.deletedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get agentId(): string {
    return this._agentId;
  }
  get name(): string {
    return this._name;
  }
  get category(): string {
    return this._category;
  }
  get description(): string {
    return this._description;
  }
  get durationMinutes(): number {
    return this._durationMinutes;
  }
  get bufferMinutes(): number {
    return this._bufferMinutes;
  }
  get bookingMode(): string {
    return this._bookingMode;
  }
  get price(): PriceVO {
    return this._price;
  }
  get deposit(): DepositVO {
    return this._deposit;
  }
  get verification(): { require_otp?: boolean | null } | undefined {
    return this._verification;
  }
  get resourceRequirements(): ResourceRequirement[] {
    return this._resourceRequirements.map((r) => ({
      role: r.role,
      resourceType: r.resourceType,
      count: r.count,
      eligibleResourceIds: [...r.eligibleResourceIds],
      selectionMode: r.selectionMode,
    }));
  }

  getEffectiveResourceRequirements(): ResourceRequirement[] {
    return this._resourceRequirements.map((r) => ({
      role: r.role,
      resourceType: r.resourceType,
      count: Math.max(1, r.count || 1),
      eligibleResourceIds: [...r.eligibleResourceIds],
      selectionMode:
        r.selectionMode || (r.resourceType === 'staff' ? 'user_selectable' : 'auto_assign'),
    }));
  }

  get recallIntervalDays(): number {
    return this._recallIntervalDays;
  }
  get isDeleted(): boolean {
    return this._isDeleted;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  softDelete(): void {
    this._isDeleted = true;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  updateDetails(details: {
    name?: string;
    category?: string;
    description?: string;
    durationMinutes?: number;
    bufferMinutes?: number;
    bookingMode?: string;
    price?: PriceVO;
    deposit?: DepositVO;
    verification?: { require_otp?: boolean | null };
    resourceRequirements?: ResourceRequirement[];
    recallIntervalDays?: number;
  }): void {
    if (details.name !== undefined) {
      if (!details.name || details.name.trim() === '') {
        throw new Error('Service name cannot be empty');
      }
      this._name = details.name.trim();
    }
    if (details.category !== undefined) {
      this._category = details.category.trim();
    }
    if (details.description !== undefined) {
      this._description = details.description.trim();
    }
    if (details.durationMinutes !== undefined) {
      if (details.durationMinutes < 1) {
        throw new Error('Service duration must be at least 1 minute');
      }
      this._durationMinutes = details.durationMinutes;
    }
    if (details.bufferMinutes !== undefined) {
      if (details.bufferMinutes < 0) {
        throw new Error('Buffer minutes cannot be negative');
      }
      this._bufferMinutes = details.bufferMinutes;
    }
    if (details.bookingMode !== undefined) {
      this._bookingMode = details.bookingMode;
    }
    if (details.price !== undefined) {
      this._price = details.price;
    }
    if (details.deposit !== undefined) {
      this._deposit = details.deposit;
    }
    if (details.verification !== undefined) {
      this._verification = details.verification;
    }
    if (details.resourceRequirements !== undefined) {
      this._resourceRequirements = details.resourceRequirements.map((r) => ({
        role: r.role?.trim() || 'Staff',
        resourceType: r.resourceType?.trim() || 'staff',
        count: Math.max(1, r.count || 1),
        eligibleResourceIds: [...(r.eligibleResourceIds ?? [])],
      }));
    }
    if (details.recallIntervalDays !== undefined) {
      this._recallIntervalDays = details.recallIntervalDays;
    }
    this._updatedAt = new Date();
  }
}
