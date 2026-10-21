export type ResourceType = 'staff' | 'room' | 'chair' | 'bay' | 'equipment' | 'asset' | 'vehicle';
export type DispatchStatus = 'active' | 'on_leave' | 'maintenance' | 'retired' | 'inactive';

export interface ResourceEntityProps {
  id: string;
  tenantId: string;
  agentId: string;
  resourceType: ResourceType;
  name: string;
  title: string;
  category: string;
  description: string;
  isBookable: boolean;
  dispatchStatus: DispatchStatus;
  customShiftOverridesJson: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ResourceEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _agentId: string;
  private _resourceType: ResourceType;
  private _name: string;
  private _title: string;
  private _category: string;
  private _description: string;
  private _isBookable: boolean;
  private _dispatchStatus: DispatchStatus;
  private _customShiftOverridesJson: string;
  private _isDeleted: boolean;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ResourceEntityProps) {
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID is required for Resource');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('Resource name cannot be empty');
    }

    this._id = props.id;
    this._tenantId = props.tenantId;
    this._agentId = props.agentId;
    this._resourceType = props.resourceType ?? 'staff';
    this._name = props.name.trim();
    this._title = props.title?.trim() ?? '';
    this._category = props.category?.trim() ?? 'General';
    this._description = props.description?.trim() ?? '';
    this._isBookable = props.isBookable ?? true;
    this._dispatchStatus = props.dispatchStatus ?? 'active';
    this._customShiftOverridesJson = props.customShiftOverridesJson ?? '{}';
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
  get resourceType(): ResourceType {
    return this._resourceType;
  }
  get name(): string {
    return this._name;
  }
  get title(): string {
    return this._title;
  }
  get category(): string {
    return this._category;
  }
  get description(): string {
    return this._description;
  }
  get isBookable(): boolean {
    return this._isBookable;
  }
  get dispatchStatus(): DispatchStatus {
    return this._dispatchStatus;
  }
  get customShiftOverridesJson(): string {
    return this._customShiftOverridesJson;
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
    resourceType?: ResourceType;
    name?: string;
    title?: string;
    category?: string;
    description?: string;
    isBookable?: boolean;
    dispatchStatus?: DispatchStatus;
    customShiftOverridesJson?: string;
  }): void {
    if (details.resourceType !== undefined) {
      this._resourceType = details.resourceType;
    }
    if (details.name !== undefined) {
      if (!details.name || details.name.trim() === '') {
        throw new Error('Resource name cannot be empty');
      }
      this._name = details.name.trim();
    }
    if (details.title !== undefined) {
      this._title = details.title.trim();
    }
    if (details.category !== undefined) {
      this._category = details.category.trim();
    }
    if (details.description !== undefined) {
      this._description = details.description.trim();
    }
    if (details.isBookable !== undefined) {
      this._isBookable = details.isBookable;
    }
    if (details.dispatchStatus !== undefined) {
      this._dispatchStatus = details.dispatchStatus;
    }
    if (details.customShiftOverridesJson !== undefined) {
      this._customShiftOverridesJson = details.customShiftOverridesJson;
    }
    this._updatedAt = new Date();
  }
}
