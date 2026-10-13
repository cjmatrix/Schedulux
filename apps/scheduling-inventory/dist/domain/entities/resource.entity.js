export class ResourceEntity {
    _id;
    _tenantId;
    _resourceType;
    _name;
    _title;
    _category;
    _description;
    _isBookable;
    _dispatchStatus;
    _customShiftOverridesJson;
    _createdAt;
    _updatedAt;
    constructor(props) {
        if (!props.tenantId || props.tenantId.trim() === '') {
            throw new Error('Tenant ID is required for Resource');
        }
        if (!props.name || props.name.trim() === '') {
            throw new Error('Resource name cannot be empty');
        }
        this._id = props.id;
        this._tenantId = props.tenantId;
        this._resourceType = props.resourceType ?? 'staff';
        this._name = props.name.trim();
        this._title = props.title?.trim() ?? '';
        this._category = props.category?.trim() ?? 'General';
        this._description = props.description?.trim() ?? '';
        this._isBookable = props.isBookable ?? true;
        this._dispatchStatus = props.dispatchStatus ?? 'active';
        this._customShiftOverridesJson = props.customShiftOverridesJson ?? '{}';
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
    }
    get id() { return this._id; }
    get tenantId() { return this._tenantId; }
    get resourceType() { return this._resourceType; }
    get name() { return this._name; }
    get title() { return this._title; }
    get category() { return this._category; }
    get description() { return this._description; }
    get isBookable() { return this._isBookable; }
    get dispatchStatus() { return this._dispatchStatus; }
    get customShiftOverridesJson() { return this._customShiftOverridesJson; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    updateDetails(details) {
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
