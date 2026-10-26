import { DepositVO } from '../value-objects/deposit.vo.js';
import { PriceVO } from '../value-objects/price.vo.js';

export type BookingMode = 'time_slot' | 'date_range';
export type BookingSource = 'manual' | 'customer_agent' | 'web_portal';
export type BookingStatus = 'confirmed' | 'pending_deposit' | 'cancelled' | 'completed' | 'no_show';
export type BookingDepositStatus = 'not_required' | 'pending' | 'verified' | 'waived';

export interface CustomerSnapshot {
  name: string;
  phone: string;
  email?: string;
}

export interface BookingEntityProps {
  id: string;
  bookingReference: string;
  tenantId: string;
  agentId: string;
  serviceId: string;
  resourceId?: string | null;
  resourceIds?: string[];
  assignedAssetIds?: string[];
  customerId: string;
  customerSnapshot: CustomerSnapshot;
  bookingMode?: BookingMode;
  startTime: Date;
  endTime: Date;
  effectiveEndTime?: Date;
  bufferMinutes?: number;
  durationMinutes: number;
  source?: BookingSource;
  status?: BookingStatus;
  depositStatus?: BookingDepositStatus;
  price: PriceVO;
  deposit?: DepositVO;
  notes?: string;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BookingEntity {
  private readonly _id: string;
  private readonly _bookingReference: string;
  private readonly _tenantId: string;
  private readonly _agentId: string;
  private readonly _serviceId: string;
  private _resourceId: string | null;
  private _resourceIds: string[];
  private _assignedAssetIds: string[];
  private readonly _customerId: string;
  private _customerSnapshot: CustomerSnapshot;
  private _bookingMode: BookingMode;
  private _startTime: Date;
  private _endTime: Date;
  private _effectiveEndTime: Date;
  private _bufferMinutes: number;
  private _durationMinutes: number;
  private _source: BookingSource;
  private _status: BookingStatus;
  private _depositStatus: BookingDepositStatus;
  private _price: PriceVO;
  private _deposit: DepositVO;
  private _notes: string;
  private _createdBy: string;
  private _isDeleted: boolean;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: BookingEntityProps) {
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID is required for Booking');
    }
    if (!props.serviceId || props.serviceId.trim() === '') {
      throw new Error('Service ID is required for Booking');
    }
    if (!props.customerId || props.customerId.trim() === '') {
      throw new Error('Customer ID is required for Booking');
    }
    if (!props.bookingReference || props.bookingReference.trim() === '') {
      throw new Error('Booking reference is required');
    }
    if (props.startTime >= props.endTime) {
      throw new Error('Booking start time must be before end time');
    }

    this._id = props.id;
    this._bookingReference = props.bookingReference;
    this._tenantId = props.tenantId;
    this._agentId = props.agentId || '';
    this._serviceId = props.serviceId;
    const rIds = props.resourceIds ? [...props.resourceIds] : (props.resourceId ? [props.resourceId] : []);
    this._resourceIds = rIds;
    this._resourceId = props.resourceId !== undefined ? props.resourceId : (rIds[0] ?? null);
    this._assignedAssetIds = props.assignedAssetIds ?? [];
    this._customerId = props.customerId;
    this._customerSnapshot = {
      name: props.customerSnapshot.name?.trim() || 'Guest',
      phone: props.customerSnapshot.phone?.trim() || '',
      email: props.customerSnapshot.email?.trim() || '',
    };
    this._bookingMode = props.bookingMode ?? 'time_slot';
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._bufferMinutes = props.bufferMinutes ?? 0;
    this._effectiveEndTime =
      props.effectiveEndTime ??
      new Date(this._endTime.getTime() + this._bufferMinutes * 60 * 1000);
    this._durationMinutes = props.durationMinutes;
    this._source = props.source ?? 'manual';
    this._status = props.status ?? 'confirmed';
    this._depositStatus = props.depositStatus ?? 'not_required';
    this._price = props.price ?? PriceVO.create();
    this._deposit = props.deposit ?? DepositVO.create();
    this._notes = props.notes?.trim() || '';
    this._createdBy = props.createdBy?.trim() || '';
    this._isDeleted = props.isDeleted ?? false;
    this._deletedAt = props.deletedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get bookingReference(): string {
    return this._bookingReference;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get agentId(): string {
    return this._agentId;
  }

  get serviceId(): string {
    return this._serviceId;
  }

  get resourceId(): string | null {
    return this._resourceId;
  }

  get resourceIds(): string[] {
    return [...this._resourceIds];
  }

  get assignedAssetIds(): string[] {
    return [...this._assignedAssetIds];
  }

  get customerId(): string {
    return this._customerId;
  }

  get customerSnapshot(): CustomerSnapshot {
    return { ...this._customerSnapshot };
  }

  get bookingMode(): BookingMode {
    return this._bookingMode;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get endTime(): Date {
    return this._endTime;
  }

  get effectiveEndTime(): Date {
    return this._effectiveEndTime;
  }

  get bufferMinutes(): number {
    return this._bufferMinutes;
  }

  get durationMinutes(): number {
    return this._durationMinutes;
  }

  get source(): BookingSource {
    return this._source;
  }

  get status(): BookingStatus {
    return this._status;
  }

  get depositStatus(): BookingDepositStatus {
    return this._depositStatus;
  }

  get price(): PriceVO {
    return this._price;
  }

  get deposit(): DepositVO {
    return this._deposit;
  }

  get notes(): string {
    return this._notes;
  }

  get createdBy(): string {
    return this._createdBy;
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

  assignResource(resourceId: string): void {
    this._resourceId = resourceId;
    this._updatedAt = new Date();
  }

  confirm(): void {
    this._status = 'confirmed';
    this._updatedAt = new Date();
  }

  cancel(): void {
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  complete(): void {
    this._status = 'completed';
    this._updatedAt = new Date();
  }

  markDepositVerified(): void {
    this._depositStatus = 'verified';
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._isDeleted = true;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }
}
