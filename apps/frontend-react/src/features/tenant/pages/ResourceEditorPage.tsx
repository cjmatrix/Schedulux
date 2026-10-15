import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Clock,
  Shield,
  Trash2,
  Loader2,
  CheckCircle2,
  Building2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Plus,
  X,
  Wrench,
  Armchair,
  Car,
} from 'lucide-react';
import {
  useResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from '../hooks/useResources';
import type {
  CreateResourcePayload,
  UpdateResourcePayload,
  WeeklySchedule,
  DaySchedule,
} from '../api/resourcesApi';

interface ResourceEditorPageProps {
  mode?: 'create' | 'edit';
}

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: {
    enabled: true,
    shifts: [{ start: '09:00', end: '17:00' }],
    reason: '',
  },
  tuesday: {
    enabled: true,
    shifts: [{ start: '09:00', end: '17:00' }],
    reason: '',
  },
  wednesday: {
    enabled: true,
    shifts: [{ start: '09:00', end: '17:00' }],
    reason: '',
  },
  thursday: {
    enabled: true,
    shifts: [{ start: '09:00', end: '17:00' }],
    reason: '',
  },
  friday: {
    enabled: true,
    shifts: [{ start: '09:00', end: '17:00' }],
    reason: '',
  },
  saturday: {
    enabled: false,
    shifts: [],
    reason: 'Weekend Off',
  },
  sunday: {
    enabled: false,
    shifts: [],
    reason: 'Weekend Off',
  },
};

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function calculateShiftHours(shifts: { start: string; end: string }[]): number {
  let totalMinutes = 0;
  for (const shift of shifts) {
    if (!shift.start || !shift.end) continue;
    const [startH, startM] = shift.start.split(':').map(Number);
    const [endH, endM] = shift.end.split(':').map(Number);
    if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
      const diff = endH * 60 + endM - (startH * 60 + startM);
      if (diff > 0) totalMinutes += diff;
    }
  }
  return Number((totalMinutes / 60).toFixed(1));
}

export default function ResourceEditorPage({ mode = 'edit' }: ResourceEditorPageProps) {
  const navigate = useNavigate();
  const { id: resourceIdFromParams, agentId } = useParams<{ id: string; agentId?: string }>();

  const isCreateMode = mode === 'create' || !resourceIdFromParams || resourceIdFromParams === 'new';

 
  const { data: resourceResponse, isLoading: isResourceLoading } = useResource(
    isCreateMode ? undefined : resourceIdFromParams,
  );


  const createResourceMutation = useCreateResource();
  const updateResourceMutation = useUpdateResource();
  const deleteResourceMutation = useDeleteResource();

  
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [resourceType, setResourceType] = useState<
    'staff' | 'room' | 'chair' | 'bay' | 'equipment' | 'asset' | 'vehicle'
  >('staff');
  const [dispatchStatus, setDispatchStatus] = useState<
    'active' | 'on_leave' | 'maintenance' | 'retired' | 'inactive'
  >('active');
  const [description, setDescription] = useState('');
  const [isBookable, setIsBookable] = useState(true);


  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);


  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

 
  useEffect(() => {
    if (resourceResponse?.data && !isCreateMode) {
      const res = resourceResponse.data;
      setName(res.name || '');
      setTitle(res.title || '');
      setCategory(res.category || 'General');
      setResourceType(
        (res.resource_type as
          | 'staff'
          | 'room'
          | 'chair'
          | 'bay'
          | 'equipment'
          | 'asset'
          | 'vehicle') || 'staff',
      );
      setDispatchStatus(
        (res.dispatch_status as
          | 'active'
          | 'on_leave'
          | 'maintenance'
          | 'retired'
          | 'inactive') || 'active',
      );
      setDescription(res.description || '');
      setIsBookable(res.is_bookable !== undefined ? res.is_bookable : true);

      
      if (res.custom_shift_overrides_json) {
        try {
          const parsed = JSON.parse(res.custom_shift_overrides_json);
          if (parsed && typeof parsed === 'object') {
            setSchedule((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        } catch {
        
        }
      }
    }
  }, [resourceResponse, isCreateMode]);

 
  const initials = useMemo(() => {
    if (!name.trim()) return 'RS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

 
  const handleToggleDay = (dayKey: string) => {
    setSchedule((prev) => {
      const current = prev[dayKey] || { enabled: false, shifts: [] };
      const nextEnabled = !current.enabled;
      return {
        ...prev,
        [dayKey]: {
          ...current,
          enabled: nextEnabled,
          shifts:
            nextEnabled && (!current.shifts || current.shifts.length === 0)
              ? [{ start: '08:00', end: '17:00' }]
              : current.shifts,
          reason: nextEnabled ? '' : current.reason || 'Closed / Off',
        },
      };
    });
  };

 
  const handleShiftChange = (
    dayKey: string,
    shiftIndex: number,
    field: 'start' | 'end',
    value: string,
  ) => {
    setSchedule((prev) => {
      const current = prev[dayKey] || { enabled: true, shifts: [] };
      const newShifts = [...(current.shifts || [])];
      if (newShifts[shiftIndex]) {
        newShifts[shiftIndex] = {
          ...newShifts[shiftIndex],
          [field]: value,
        };
      }
      return {
        ...prev,
        [dayKey]: {
          ...current,
          shifts: newShifts,
        },
      };
    });
  };

  // Add split shift
  const handleAddSplitShift = (dayKey: string) => {
    setSchedule((prev) => {
      const current = prev[dayKey] || { enabled: true, shifts: [] };
      const newShifts = [...(current.shifts || [])];
      newShifts.push({ start: '14:00', end: '18:00' });
      return {
        ...prev,
        [dayKey]: {
          ...current,
          shifts: newShifts,
        },
      };
    });
  };


  const handleRemoveShift = (dayKey: string, shiftIndex: number) => {
    setSchedule((prev) => {
      const current = prev[dayKey] || { enabled: true, shifts: [] };
      const newShifts = current.shifts.filter((_, idx) => idx !== shiftIndex);
      return {
        ...prev,
        [dayKey]: {
          ...current,
          shifts: newShifts,
          enabled: newShifts.length > 0,
        },
      };
    });
  };

  
  const handleChangeReason = (dayKey: string, reason: string) => {
    setSchedule((prev) => {
      const current = prev[dayKey] || { enabled: false, shifts: [] };
      return {
        ...prev,
        [dayKey]: {
          ...current,
          reason,
        },
      };
    });
  };


  const handleResetToDefault = () => {
    setSchedule(DEFAULT_WEEKLY_SCHEDULE);
  };

 
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Resource name is required.');
      return;
    }

    const payload: CreateResourcePayload | UpdateResourcePayload = {
      agent_id: agentId || (resourceResponse?.data as any)?.agent_id || '',
      name: name.trim(),
      title: title.trim(),
      category: category.trim() || 'General',
      resource_type: resourceType,
      dispatch_status: dispatchStatus,
      description: description.trim(),
      is_bookable: isBookable,
      custom_shift_overrides_json: JSON.stringify(schedule),
    };

    try {
      if (isCreateMode) {
        const created = await createResourceMutation.mutateAsync(payload as CreateResourcePayload);
        setSaveSuccess(true);
        setTimeout(() => {
          navigate(
            agentId
              ? `/tenant/agents/${agentId}/resources/${created.data.resource_id}`
              : `/tenant/inventory/${created.data.resource_id}`,
          );
        }, 600);
      } else {
        await updateResourceMutation.mutateAsync({
          resourceId: resourceIdFromParams!,
          payload,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save resource. Please try again.';
      setErrorMsg(message);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!resourceIdFromParams) return;
    try {
      await deleteResourceMutation.mutateAsync(resourceIdFromParams);
      navigate(agentId ? `/tenant/agents/${agentId}/resources` : '/tenant/inventory');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete resource.';
      setErrorMsg(message);
      setShowDeleteModal(false);
    }
  };

  const copyResourceId = () => {
    const idToCopy = resourceIdFromParams || 'new';
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isSaving = createResourceMutation.isPending || updateResourceMutation.isPending;

  if (isResourceLoading && !isCreateMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <p className="text-sm font-medium">Loading resource profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      {/* Top Header Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
          <button
            type="button"
            onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/resources` : '/tenant/inventory')}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span>/</span>
          {agentId && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/tenant/agents/${agentId}/dashboard`)}
                className="hover:text-slate-900 font-bold transition-colors cursor-pointer"
              >
                {agentId}
              </button>
              <span>/</span>
            </>
          )}
          <button
            type="button"
            onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/resources` : '/tenant/inventory')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Resources & Inventory
          </button>
          <span>/</span>
          <span className="capitalize">{resourceType}</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">
            {name || (isCreateMode ? 'New Resource' : 'Resource Profile')}
          </span>
        </div>

        {/* Title & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {isCreateMode
                ? 'Create New Resource'
                : `Edit Profile: ${name || 'Resource'}`}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/resources` : '/tenant/inventory')}
              className="px-4 py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreateMode ? 'Create Resource' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Content Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* ======================================================== */}
        {/* SECTION 1: General Information                           */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          {/* Section Header */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              General Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Resource identity, role/specialization, and operational dispatch parameters.
            </p>
          </div>

          {/* Profile Badge Banner (No photo upload field as requested) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/70">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-950 text-white font-bold text-lg flex items-center justify-center shadow-inner tracking-wider">
                  {resourceType === 'staff' ? (
                    initials
                  ) : resourceType === 'room' || resourceType === 'bay' ? (
                    <Building2 className="w-6 h-6 text-slate-300" />
                  ) : resourceType === 'chair' ? (
                    <Armchair className="w-6 h-6 text-slate-300" />
                  ) : resourceType === 'vehicle' ? (
                    <Car className="w-6 h-6 text-slate-300" />
                  ) : (
                    <Wrench className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                {dispatchStatus === 'active' && (
                  <span
                    className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-2xs"
                    title="Active for AI Dispatch"
                  />
                )}
                {dispatchStatus === 'on_leave' && (
                  <span
                    className="w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-2xs"
                    title="On Leave"
                  />
                )}
                {dispatchStatus === 'maintenance' && (
                  <span
                    className="w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-2xs"
                    title="Maintenance"
                  />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{name || 'Resource Name'}</span>
                  {title && <span className="text-slate-400 font-normal text-xs">• {title}</span>}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {dispatchStatus === 'active'
                      ? 'Active (Available for AI Dispatch)'
                      : dispatchStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {resourceType} • {category || 'General'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBookable}
                  onChange={(e) => setIsBookable(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                />
                <span>Bookable Resource</span>
              </label>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Resource Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor, Conference Room A, or Service Bay 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Title / Role / Specialization
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Consultant, Lead Stylist, or Physical Room"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Type & Dispatch Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) =>
                  setResourceType(
                    e.target.value as
                      | 'staff'
                      | 'room'
                      | 'chair'
                      | 'bay'
                      | 'equipment'
                      | 'asset'
                      | 'vehicle',
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer"
              >
                <option value="staff">Staff (Team Member / Consultant / Specialist)</option>
                <option value="room">Room (Meeting Room / Private Suite)</option>
                <option value="chair">Station / Chair (Service Desk / Chair)</option>
                <option value="bay">Bay / Workspace</option>
                <option value="equipment">Equipment (Device / Machine / Tool)</option>
                <option value="asset">Physical Asset</option>
                <option value="vehicle">Vehicle / Fleet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Consultation, Support, Operations, Equipment"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Dispatch Status
              </label>
              <select
                value={dispatchStatus}
                onChange={(e) =>
                  setDispatchStatus(
                    e.target.value as
                      | 'active'
                      | 'on_leave'
                      | 'maintenance'
                      | 'retired'
                      | 'inactive',
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer"
              >
                <option value="active">Active (Available for AI Dispatch)</option>
                <option value="on_leave">On Leave (Temporary Unavailable)</option>
                <option value="maintenance">Maintenance (Out of Service)</option>
                <option value="retired">Retired</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Operational Notes & Autonomous Buffer Rules */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Operational Notes & Autonomous Dispatch Rules
              </label>
              <span className="text-[11px] font-medium text-slate-400 tracking-tight">
                Parsed by Agent Runtime
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify scheduling constraints, preparation requirements, or buffer rules. (e.g. 'Allow 15 minutes setup buffer between appointments. Do not schedule back-to-back consultations without a 10-minute break.')"
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all leading-relaxed resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Schedulux automatically inserts dynamic padding into Google Calendar and voice-booking agent reservations.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: Custom Working Hours                          */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Custom Working Hours
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Override the organization's default operating hours for this specific resource.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset to Default Hours</span>
            </button>
          </div>

          {/* Daily Schedule Rows */}
          <div className="space-y-2.5">
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const dayData: DaySchedule = schedule[key] || {
                enabled: false,
                shifts: [],
                reason: 'Closed',
              };
              const isEnabled = Boolean(dayData.enabled);
              const shifts = dayData.shifts || [];
              const availableHours = isEnabled ? calculateShiftHours(shifts) : 0;

              return (
                <div
                  key={key}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-white border-slate-200/90 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                  }`}
                >
                  {/* Left: Checkbox & Day Name */}
                  <div className="flex items-center gap-3 min-w-[130px]">
                    <input
                      type="checkbox"
                      id={`day-${key}`}
                      checked={isEnabled}
                      onChange={() => handleToggleDay(key)}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${key}`}
                      className="text-xs font-bold text-slate-900 cursor-pointer select-none"
                    >
                      {label}
                    </label>
                  </div>

                  {/* Center: Shifts or Closed Reason */}
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {isEnabled ? (
                      <>
                        {shifts.map((shift, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs"
                          >
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="time"
                              value={shift.start}
                              onChange={(e) =>
                                handleShiftChange(key, idx, 'start', e.target.value)
                              }
                              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                            <span className="text-slate-400 font-medium">to</span>
                            <input
                              type="time"
                              value={shift.end}
                              onChange={(e) =>
                                handleShiftChange(key, idx, 'end', e.target.value)
                              }
                              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                            {shifts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveShift(key, idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer ml-1"
                                title="Remove shift"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        {shifts.length < 2 && (
                          <button
                            type="button"
                            onClick={() => handleAddSplitShift(key)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Split Shift</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 text-slate-600 text-xs font-medium">
                          {dayData.reason || 'Closed / Off'}
                        </span>
                        <input
                          type="text"
                          value={dayData.reason || ''}
                          onChange={(e) => handleChangeReason(key, e.target.value)}
                          placeholder="Override reason (e.g. Day Off, Training)"
                          className="text-[11px] px-2 py-0.5 rounded border border-slate-200 text-slate-600 focus:outline-none focus:border-slate-400 max-w-[200px]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Hours badge */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isEnabled && availableHours > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isEnabled ? `${availableHours} hrs available` : '0.0 hrs'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Autonomous Notice Footer */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs">
            <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              Schedulux AI voice and autonomous text agents will strictly offer appointment slots within these confirmed operating hours.
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOOTER ACTIONS & AUDIT META                              */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-6 text-xs text-slate-500 border-t border-slate-200/60">
          <div className="flex items-center gap-3">
            {!isCreateMode && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete this resource</span>
              </button>
            )}

            {!isCreateMode && (
              <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                <span>ID: {resourceIdFromParams}</span>
                <button
                  type="button"
                  onClick={copyResourceId}
                  className="p-1 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Copy Resource ID"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div>
            <span>
              Last modified by Workspace Admin •{' '}
              {resourceResponse?.data?.updated_at
                ? new Date(resourceResponse.data.updated_at).toLocaleDateString()
                : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete "{name || 'Resource'}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this resource? Services assigned to this resource will no longer be able to book slots with it.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteResourceMutation.isPending}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {deleteResourceMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
