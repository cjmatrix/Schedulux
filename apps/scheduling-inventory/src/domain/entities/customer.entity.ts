export interface CustomerEntityProps {
  id: string;
  tenantId: string;
  agentId?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  isGuest?: boolean;
  totalBookings?: number;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CustomerEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _agentId: string;
  private _name: string;
  private _phone: string;
  private _email: string;
  private _notes: string;
  private _isGuest: boolean;
  private _totalBookings: number;
  private _isDeleted: boolean;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CustomerEntityProps) {
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID is required for Customer');
    }
    if (!props.phone || props.phone.trim() === '') {
      throw new Error('Customer phone number is required');
    }

    this._id = props.id;
    this._tenantId = props.tenantId;
    this._agentId = props.agentId?.trim() || '';
    this._name = props.name?.trim() || 'Guest';
    this._phone = props.phone.trim();
    this._email = props.email?.trim() || '';
    this._notes = props.notes?.trim() || '';
    this._isGuest = props.isGuest ?? false;
    this._totalBookings = props.totalBookings ?? 0;
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

  get phone(): string {
    return this._phone;
  }

  get email(): string {
    return this._email;
  }

  get notes(): string {
    return this._notes;
  }

  get isGuest(): boolean {
    return this._isGuest;
  }

  get totalBookings(): number {
    return this._totalBookings;
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

  incrementBookings(): void {
    this._totalBookings += 1;
    this._updatedAt = new Date();
  }

  updateDetails(details: { name?: string; email?: string; notes?: string }): void {
    if (details.name !== undefined && details.name.trim() !== '') {
      this._name = details.name.trim();
    }
    if (details.email !== undefined) {
      this._email = details.email.trim();
    }
    if (details.notes !== undefined) {
      this._notes = details.notes.trim();
    }
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._isDeleted = true;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }
}
