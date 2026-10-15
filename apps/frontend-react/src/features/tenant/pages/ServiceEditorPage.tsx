import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Clock,
  Bell,
  Shield,
  Plus,
  X,
  Trash2,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Building2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  useService,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useResourcesList,
  useCreateResource,
} from '../hooks/useServices';
import type { CreateServicePayload, UpdateServicePayload } from '../api/servicesApi';

interface ServiceEditorPageProps {
  mode?: 'create' | 'edit';
}

export default function ServiceEditorPage({ mode = 'edit' }: ServiceEditorPageProps) {
  const navigate = useNavigate();
  const { id: serviceIdFromParams, agentId } = useParams<{ id: string; agentId?: string }>();

  const isCreateMode = mode === 'create' || !serviceIdFromParams || serviceIdFromParams === 'new';

  // Queries
  const {
    data: serviceResponse,
    isLoading: isServiceLoading,
  } = useService(isCreateMode ? undefined : serviceIdFromParams);

  const { data: resourcesResponse } = useResourcesList(agentId ? { agent_id: agentId } : undefined);
  const allResources = resourcesResponse?.data || [];

  // Mutations
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();
  const createResourceMutation = useCreateResource();

  // Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Surgery');
  const [priceAmount, setPriceAmount] = useState<number>(350);
  const [priceCurrency, setPriceCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [bufferMinutes, setBufferMinutes] = useState<number>(20);
  const [recallIntervalDays, setRecallIntervalDays] = useState<number>(0);
  const [allocationModel, setAllocationModel] = useState<
    'single_resource' | 'multi_resource' | 'pooled' | 'asset_only'
  >('single_resource');
  const [bookingMode, setBookingMode] = useState<'time_slot' | 'date_range'>('time_slot');

  // Resource linkage IDs
  const [eligibleResourceIds, setEligibleResourceIds] = useState<string[]>([]);
  const [requiredAssetIds, setRequiredAssetIds] = useState<string[]>([]);

  // Modals for resource assignment
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  // Quick resource creation inside modal
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('');

  // UI state
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Populate existing data when editing
  useEffect(() => {
    if (!isCreateMode && serviceResponse?.data) {
      const s = serviceResponse.data;
      setName(s.name || '');
      setCategory(s.category || 'General');
      setPriceAmount(s.price?.amount ?? 0);
      setPriceCurrency(s.price?.currency || 'USD');
      setDescription(s.description || '');
      setRequireDeposit(s.deposit?.required ?? false);
      setDepositAmount(s.deposit?.amount ?? 0);
      setDurationMinutes(s.duration_minutes || 30);
      setBufferMinutes(s.buffer_minutes ?? 0);
      setRecallIntervalDays(s.recall_interval_days ?? 0);
      setAllocationModel(
        (s.allocation_model as 'single_resource' | 'multi_resource' | 'pooled' | 'asset_only') ||
          'single_resource'
      );
      setBookingMode(
        (s.booking_mode as 'time_slot' | 'date_range') || 'time_slot'
      );
      setEligibleResourceIds(s.eligible_resource_ids || []);
      setRequiredAssetIds(s.required_asset_ids || []);
    }
  }, [isCreateMode, serviceResponse]);

  // Derived available staff & physical assets
  const staffResources = useMemo(
    () => allResources.filter((r) => r.resource_type === 'staff'),
    [allResources]
  );

  const assetResources = useMemo(
    () => allResources.filter((r) => r.resource_type !== 'staff'),
    [allResources]
  );

  const selectedStaffList = useMemo(() => {
    return eligibleResourceIds.map((id) => {
      const found = staffResources.find((r) => r.resource_id === id);
      return {
        id,
        name: found?.name || id,
        title: found?.title || 'Specialist',
      };
    });
  }, [eligibleResourceIds, staffResources]);

  const selectedAssetList = useMemo(() => {
    return requiredAssetIds.map((id) => {
      const found = assetResources.find((r) => r.resource_id === id);
      return {
        id,
        name: found?.name || id,
        category: found?.category || 'Facility Asset',
      };
    });
  }, [requiredAssetIds, assetResources]);

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Service name is required.' });
      return;
    }

    setFeedbackMessage(null);

    const payload: CreateServicePayload = {
      agent_id: agentId || (serviceResponse?.data as any)?.agent_id || '',
      name: name.trim(),
      category: category.trim() || 'General',
      description: description.trim(),
      duration_minutes: Number(durationMinutes) || 30,
      buffer_minutes: Number(bufferMinutes) || 0,
      allocation_model: allocationModel,
      booking_mode: bookingMode,
      price: {
        type: 'fixed',
        amount: Number(priceAmount) || 0,
        currency: priceCurrency,
      },
      deposit: {
        required: requireDeposit,
        amount: requireDeposit ? Number(depositAmount) || 0 : 0,
        processor: 'platform_managed',
        confirmation_method: 'automatic',
      },
      eligible_resource_ids: eligibleResourceIds,
      required_asset_ids: requiredAssetIds,
      recall_interval_days: Number(recallIntervalDays) || 0,
    };

    try {
      if (isCreateMode) {
        const res = await createServiceMutation.mutateAsync(payload);
        setFeedbackMessage({ type: 'success', text: 'Service created successfully!' });
        setTimeout(() => {
          navigate(
            agentId
              ? `/tenant/agents/${agentId}/services/${res.data.service_id}`
              : `/tenant/services/${res.data.service_id}`,
          );
        }, 600);
      } else {
        await updateServiceMutation.mutateAsync({
          serviceId: serviceIdFromParams!,
          payload: payload as UpdateServicePayload,
        });
        setFeedbackMessage({ type: 'success', text: 'Service changes saved successfully!' });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to save service.';
      setFeedbackMessage({ type: 'error', text: errMsg });
    }
  };

  const handleDelete = async () => {
    if (!serviceIdFromParams) return;
    try {
      await deleteServiceMutation.mutateAsync(serviceIdFromParams);
      navigate(agentId ? `/tenant/agents/${agentId}/services` : '/tenant/services');
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to delete service.',
      });
      setIsDeleteConfirmOpen(false);
    }
  };

  // Staff helpers
  const handleRemoveStaff = (id: string) => {
    setEligibleResourceIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAddStaff = (id: string) => {
    if (!eligibleResourceIds.includes(id)) {
      setEligibleResourceIds((prev) => [...prev, id]);
    }
    setIsStaffModalOpen(false);
  };

  const handleCreateNewStaff = async () => {
    if (!newStaffName.trim()) return;
    try {
      const res = await createResourceMutation.mutateAsync({
        agent_id: agentId || '',
        resource_type: 'staff',
        name: newStaffName.trim(),
        title: newStaffTitle.trim() || 'Staff Practitioner',
        category: 'Clinical',
        is_bookable: true,
      });
      setEligibleResourceIds((prev) => [...prev, res.data.resource_id]);
      setNewStaffName('');
      setNewStaffTitle('');
      setIsStaffModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Could not create staff resource');
    }
  };

  // Asset helpers
  const handleRemoveAsset = (id: string) => {
    setRequiredAssetIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAddAsset = (id: string) => {
    if (!requiredAssetIds.includes(id)) {
      setRequiredAssetIds((prev) => [...prev, id]);
    }
    setIsAssetModalOpen(false);
  };

  const handleCreateNewAsset = async () => {
    if (!newAssetName.trim()) return;
    try {
      const res = await createResourceMutation.mutateAsync({
        agent_id: agentId || '',
        resource_type: 'room',
        name: newAssetName.trim(),
        category: newAssetCategory.trim() || 'Operatory Room',
        is_bookable: true,
      });
      setRequiredAssetIds((prev) => [...prev, res.data.resource_id]);
      setNewAssetName('');
      setNewAssetCategory('');
      setIsAssetModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Could not create asset resource');
    }
  };

  const isSaving = createServiceMutation.isPending || updateServiceMutation.isPending;

  if (!isCreateMode && isServiceLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
        <span className="ml-3 text-sm font-medium">Loading service configuration...</span>
      </div>
    );
  }

  const serviceData = serviceResponse?.data;
  const displayServiceId = serviceData?.service_id || (isCreateMode ? 'srv_new_draft' : serviceIdFromParams);

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/services` : '/tenant/services')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-black font-semibold cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span>/</span>
          {agentId && (
            <>
              <span
                onClick={() => navigate(`/tenant/agents/${agentId}/dashboard`)}
                className="hover:text-slate-600 cursor-pointer transition font-bold"
              >
                {agentId}
              </span>
              <span>/</span>
            </>
          )}
          <span
            onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/services` : '/tenant/services')}
            className="hover:text-slate-600 cursor-pointer transition"
          >
            Services & Pricing
          </span>
          <span>/</span>
          <span>{category || 'General'}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-[200px]">
            {name || (isCreateMode ? 'New Service' : 'Service')}
          </span>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isCreateMode ? 'Create New Service' : `Edit Service: ${name || 'Untitled Service'}`}
            </h1>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous Triage Synced
              </span>
              <span className="text-xs text-slate-400 font-medium">• Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/services` : '/tenant/services')}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-full shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-full flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isCreateMode ? 'Create Service' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Lock Banner */}
        <div className="bg-[#f1f5f9]/70 border border-slate-200/80 rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              <strong className="text-slate-800 font-semibold">Service ID:</strong>{' '}
              <code className="text-slate-700 font-mono text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded">
                {displayServiceId}
              </code>{' '}
              • Autonomous Agent will lock multi-resource calendar slots atomically without double-booking.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium sm:text-right shrink-0">
            • v2.4 Engine
          </span>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* ========================================================= */}
          {/* MODULE 01: General Details */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-7 lg:p-8 border border-slate-200/80 shadow-2xs flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">General Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure clinical catalog name, surgical categorization, and patient fee structure.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-500 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-slate-200/60">
                Module 01
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Service Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wisdom Tooth Extraction"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Surgery, Consultation"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Price ({priceCurrency})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="350.00"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Service Description</label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Used by AI during real-time patient consultation
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="e.g. Surgical removal of impacted third molars with local anesthesia and post-op suture protocol."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition leading-relaxed"
              />
            </div>

            {/* Deposit Box */}
            <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setRequireDeposit(!requireDeposit)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    requireDeposit ? 'bg-slate-950' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      requireDeposit ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Require Deposit to Book
                </span>
              </label>

              {requireDeposit && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-500">Hold Amount:</span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODULE 02: Duration & Rules */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-7 lg:p-8 border border-slate-200/80 shadow-2xs flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Duration & Rules</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set clinical execution duration, required sanitization buffer, and automated recall workflows.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-500 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-slate-200/60">
                Module 02
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Service Duration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Service Duration</label>
                  <span className="text-[11px] text-slate-400 font-medium">Primary slot</span>
                </div>
                <div className="relative flex items-center">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                  <span className="absolute right-3.5 text-xs text-slate-400 font-medium">min</span>
                </div>
              </div>

              {/* Recall Interval */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Recall Interval</label>
                  <span className="text-[11px] text-slate-400 font-medium">Outbound CRM</span>
                </div>
                <div className="relative flex items-center">
                  <Bell className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <select
                    value={recallIntervalDays}
                    onChange={(e) => setRecallIntervalDays(parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition appearance-none cursor-pointer"
                  >
                    <option value={0}>None (Disabled)</option>
                    <option value={30}>Every 30 Days (Monthly Followup)</option>
                    <option value={90}>Every 90 Days (Quarterly Check)</option>
                    <option value={180}>Every 180 Days (6 Months Routine)</option>
                    <option value={365}>Every 365 Days (Annual Recall)</option>
                  </select>
                  <span className="absolute right-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {recallIntervalDays > 0 ? `${recallIntervalDays}d` : 'off'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Trigger the AI to automatically reach out and rebook this service after X days.
                </p>
              </div>
            </div>

            {/* Buffer Notice Card */}
            <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Shield className="w-4 h-4 text-slate-600 shrink-0" />
                <span>
                  <strong className="font-semibold text-slate-900">Deterministic Buffer Enforced:</strong>{' '}
                  Agent automatically adds {bufferMinutes}m sterile buffer to doctor and operatory schedule.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">Buffer:</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                />
                <span className="text-xs text-slate-400 font-medium">min</span>
              </div>
            </div>

            {/* Booking Mode & Allocation Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
              {/* Booking Mode */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Booking Mode</label>
                  <span className="text-[11px] text-slate-400 font-medium">Time Dimension</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingMode('time_slot')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      bookingMode === 'time_slot'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Time Slot (Hourly)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode('date_range')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      bookingMode === 'date_range'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date Range (Daily)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {bookingMode === 'time_slot'
                    ? 'Appointments booked at specific clock hours/minutes within operating hours.'
                    : 'Bookings span full calendar days or nights (e.g. rentals or stays).'}
                </p>
              </div>

              {/* Allocation Model */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Allocation Model</label>
                  <span className="text-[11px] text-slate-400 font-medium">Resource Strategy</span>
                </div>
                <select
                  value={allocationModel}
                  onChange={(e) =>
                    setAllocationModel(
                      e.target.value as 'single_resource' | 'multi_resource' | 'pooled' | 'asset_only'
                    )
                  }
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition cursor-pointer"
                >
                  <option value="single_resource">Single Resource (1 Doctor / 1 Staff Member)</option>
                  <option value="multi_resource">Multi-Resource (Simultaneous Staff + Room / Bay)</option>
                  <option value="pooled">Pooled (Auto-Assign Any Available Provider)</option>
                  <option value="asset_only">Asset Only (Room / Equipment, No Staff)</option>
                </select>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Defines how the booking engine dispatches staff and equipment from your eligible pool.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODULE 03: Required Resources */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-7 lg:p-8 border border-slate-200/80 shadow-2xs flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Required Resources</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  The AI will only book this service when these specific people and assets are available simultaneously.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-500 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-slate-200/60">
                Module 03
              </span>
            </div>

            {/* Section 1: Eligible Staff */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>Eligible Staff</span>
                  <span className="text-slate-400 font-normal">(Any 1 of)</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-full tracking-wide">
                  Disjunctive OR logic
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-wrap items-center gap-2 min-h-[52px]">
                {selectedStaffList.map((staff) => {
                  const initials = staff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={staff.id}
                      className="bg-white border border-slate-200 rounded-full pl-1.5 pr-2.5 py-1 flex items-center gap-2 shadow-2xs text-xs font-semibold text-slate-800"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {initials}
                      </div>
                      <span>{staff.name}</span>
                      <span className="text-slate-400 font-normal">({staff.title})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(staff.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(true)}
                  className="px-3.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ Add Staff</span>
                </button>
              </div>
            </div>

            {/* Section 2: Required Assets */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>Required Assets</span>
                  <span className="text-slate-400 font-normal">(All required)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full tracking-wide">
                  Conjunctive AND logic
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-wrap items-center gap-2 min-h-[52px]">
                {selectedAssetList.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-white border border-slate-200 rounded-full pl-2.5 pr-2.5 py-1 flex items-center gap-2 shadow-2xs text-xs font-semibold text-slate-800"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{asset.name}</span>
                    <span className="text-slate-400 font-normal">({asset.category})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(true)}
                  className="px-3.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ Add Asset</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-2">
              {!isCreateMode ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none self-start"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete this service</span>
                </button>
              ) : (
                <div />
              )}

              <span className="text-[11px] text-slate-400 font-medium">
                • Last modified by Clinic Admin{' '}
                {serviceData?.updated_at
                  ? `• ${new Date(serviceData.updated_at).toLocaleDateString()}`
                  : ''}
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Staff Picker / Creator Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Select Eligible Staff</h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 divide-y divide-slate-100">
              {staffResources.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No staff members created yet. You can add one below.
                </p>
              ) : (
                staffResources.map((s) => {
                  const isSelected = eligibleResourceIds.includes(s.resource_id);
                  return (
                    <button
                      key={s.resource_id}
                      type="button"
                      onClick={() => handleAddStaff(s.resource_id)}
                      disabled={isSelected}
                      className="p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition text-left cursor-pointer disabled:opacity-40"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-400">{s.title || 'Doctor / Staff'}</p>
                      </div>
                      {isSelected ? (
                        <span className="text-[11px] font-semibold text-emerald-600">Added</span>
                      ) : (
                        <Plus className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick add new staff */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Or Add New Staff Member:
              </p>
              <input
                type="text"
                placeholder="Full Name (e.g. Dr. Jane Vance)"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Title / Role (e.g. Surgeon)"
                value={newStaffTitle}
                onChange={(e) => setNewStaffTitle(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={handleCreateNewStaff}
                disabled={!newStaffName.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition"
              >
                + Create & Assign Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker / Creator Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Select Required Asset</h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 divide-y divide-slate-100">
              {assetResources.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No physical assets registered yet. You can add one below.
                </p>
              ) : (
                assetResources.map((a) => {
                  const isSelected = requiredAssetIds.includes(a.resource_id);
                  return (
                    <button
                      key={a.resource_id}
                      type="button"
                      onClick={() => handleAddAsset(a.resource_id)}
                      disabled={isSelected}
                      className="p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition text-left cursor-pointer disabled:opacity-40"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{a.name}</p>
                        <p className="text-[11px] text-slate-400">{a.category || a.resource_type}</p>
                      </div>
                      {isSelected ? (
                        <span className="text-[11px] font-semibold text-emerald-600">Added</span>
                      ) : (
                        <Plus className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick add new asset */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Or Add New Asset (Room / Bay / Equipment):
              </p>
              <input
                type="text"
                placeholder="Asset Name (e.g. Panoramic X-Ray Room)"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Category / Location (e.g. Operatory Bay 3)"
                value={newAssetCategory}
                onChange={(e) => setNewAssetCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={handleCreateNewAsset}
                disabled={!newAssetName.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition"
              >
                + Create & Assign Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete this Service?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{name}</strong>?
                The autonomous AI agent will no longer be able to schedule it.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteServiceMutation.isPending}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteServiceMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
