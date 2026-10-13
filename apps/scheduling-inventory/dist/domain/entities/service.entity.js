import { PriceVO } from '../value-objects/price.vo.js';
import { DepositVO } from '../value-objects/deposit.vo.js';
export class ServiceEntity {
    _id;
    _tenantId;
    _name;
    _category;
    _description;
    _durationMinutes;
    _bufferMinutes;
    _allocationModel;
    _price;
    _deposit;
    _eligibleResourceIds;
    _requiredAssetIds;
    _recallIntervalDays;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
        this._name = props.name.trim();
        this._category = props.category?.trim() ?? 'General';
        this._description = props.description?.trim() ?? '';
        this._durationMinutes = props.durationMinutes;
        this._bufferMinutes = props.bufferMinutes;
        this._allocationModel = props.allocationModel ?? 'single_resource';
        this._price = props.price ?? PriceVO.create();
        this._deposit = props.deposit ?? DepositVO.create();
        this._eligibleResourceIds = props.eligibleResourceIds ?? [];
        this._requiredAssetIds = props.requiredAssetIds ?? [];
        this._recallIntervalDays = props.recallIntervalDays ?? 0;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
    }
    get id() { return this._id; }
    get tenantId() { return this._tenantId; }
    get name() { return this._name; }
    get category() { return this._category; }
    get description() { return this._description; }
    get durationMinutes() { return this._durationMinutes; }
    get bufferMinutes() { return this._bufferMinutes; }
    get allocationModel() { return this._allocationModel; }
    get price() { return this._price; }
    get deposit() { return this._deposit; }
    get eligibleResourceIds() { return [...this._eligibleResourceIds]; }
    get requiredAssetIds() { return [...this._requiredAssetIds]; }
    get recallIntervalDays() { return this._recallIntervalDays; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    updateDetails(details) {
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
        if (details.allocationModel !== undefined) {
            this._allocationModel = details.allocationModel;
        }
        if (details.price !== undefined) {
            this._price = details.price;
        }
        if (details.deposit !== undefined) {
            this._deposit = details.deposit;
        }
        if (details.eligibleResourceIds !== undefined) {
            this._eligibleResourceIds = details.eligibleResourceIds;
        }
        if (details.requiredAssetIds !== undefined) {
            this._requiredAssetIds = details.requiredAssetIds;
        }
        if (details.recallIntervalDays !== undefined) {
            this._recallIntervalDays = details.recallIntervalDays;
        }
        this._updatedAt = new Date();
    }
}
