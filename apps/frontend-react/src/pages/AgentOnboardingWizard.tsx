import type { ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import { Bot, FlaskConical, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAgentOnboarding } from '../hooks/useAgentOnboarding.js';
import {
  BusinessProfileCard,
  CanvasFilterTabs,
  CanvasHeader,
  RawJsonViewer,
  ResourcesRosterCard,
  SandboxSimulation,
  SchedulingEngineCard,
  SecurityGuardrailsCard,
  ServicesCatalogCard,
  WizardChatColumn,
  WizardHeader,
} from './onboarding/components';
import type {
  CanvasModule,
  OnboardingResourceItem,
  OnboardingServiceItem,
  RightViewMode,
} from './onboarding/types.js';
import { getOperatingScheduleGroups } from './onboarding/utils.js';

export default function AgentOnboardingWizard() {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    tenantId,
    messages,
    inputValue,
    setInputValue,
    status,
    sendMessage,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    firstItemIndex,
    draftSchema,
    diffPatches,
    isDirty,
    isLive,
    isSavingChanges,
    saveChanges,
  } = useAgentOnboarding({ agentId });

  const [showDiffDrawer, setShowDiffDrawer] = useState(false);
  const [rightViewMode, setRightViewMode] = useState<RightViewMode>('rules');
  const [canvasModule, setCanvasModule] = useState<CanvasModule>('all');
  const [copiedJson, setCopiedJson] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'canvas' | 'sandbox'>('chat');

  const handleMobileTabChange = (tab: 'chat' | 'canvas' | 'sandbox') => {
    setMobileTab(tab);
    if (tab === 'sandbox') {
      setRightViewMode('sandbox');
    } else if (tab === 'canvas' && rightViewMode === 'sandbox') {
      setRightViewMode('rules');
    }
  };

  const businessProfile = draftSchema?.business_profile || {};
  const clinicName = businessProfile.name || 'AI Scheduling Agent';
  const timezone = businessProfile.timezone || '';
  const operatingHours = draftSchema?.operating_hours || {};

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessage();
  };

  const handleSaveChanges = async () => {
    await saveChanges();
    setShowDiffDrawer(false);
  };

  const scheduleGroups = getOperatingScheduleGroups(operatingHours);
  const openGroups = scheduleGroups.filter((g) => g.isOpen);

  let formattedHoursText = 'No operating hours configured';
  let dailyHoursText = 'Closed';

  if (openGroups.length === 1) {
    formattedHoursText = `${openGroups[0].label}: ${openGroups[0].timeText}`;
    dailyHoursText = openGroups[0].dailyHoursText || 'Active';
  } else if (openGroups.length > 1) {
    formattedHoursText = openGroups.map((g) => `${g.label}: ${g.timeText}`).join(' • ');
    const totalDays = openGroups.reduce((acc, g) => acc + g.days.length, 0);
    dailyHoursText = `${totalDays} days/week`;
  }

  const rawResources = (Array.isArray(draftSchema?.resources) ? draftSchema.resources : []).filter(
    (r: any) => !r.is_deleted,
  );
  const rawServices = (Array.isArray(draftSchema?.services) ? draftSchema.services : []).filter(
    (s: any) => !s.is_deleted,
  );

  const servicesList: OnboardingServiceItem[] = useMemo(() => {
    return rawServices.map((svc: Partial<ServiceInfo>, idx: number): OnboardingServiceItem => {
      const assigned = rawResources.filter((r: Partial<ResourceInfo>) => {
        if (!r.resource_id) return false;
        return svc.resource_requirements?.some((req) =>
          req.eligible_resource_ids?.includes(r.resource_id!),
        );
      });
      return {
        ...svc,
        idx,
        assignedStaff: assigned,
      };
    });
  }, [rawServices, rawResources]);

  const resourcesList: OnboardingResourceItem[] = useMemo(() => {
    return rawResources.map((res: Partial<ResourceInfo>, idx: number): OnboardingResourceItem => {
      const handled = rawServices.filter((s: Partial<ServiceInfo>) => {
        if (!res.resource_id) return false;
        return s.resource_requirements?.some((req) =>
          req.eligible_resource_ids?.includes(res.resource_id!),
        );
      });
      return {
        ...res,
        idx,
        initials: (res.name || 'ST')
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        handledServices: handled,
      };
    });
  }, [rawResources, rawServices]);

  const guardrails = draftSchema?.guardrails || {};
  const requireOtp = Boolean(guardrails?.verification_policy?.require_otp_for_new_booking ?? false);
  const phiScrubbing = Boolean(guardrails?.phi_scrubbing?.enabled);
  const emergencyTriage = Boolean(guardrails?.triage_emergency?.enabled);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(draftSchema, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  useEffect(() => {
    if (agentId) {
      localStorage.setItem('schedulux_active_agent_id', agentId);
    }
  }, [agentId]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100/70 text-slate-900 font-sans antialiased overflow-hidden select-none">
      {/* ── TOP APPLICATION HEADER ── */}
      <WizardHeader
        onNavigateAgents={() => navigate('/tenant/agents')}
        onNavigateDashboard={() =>
          navigate(
            agentId
              ? `/tenant/agents/${agentId}/dashboard?agent_id=${agentId}`
              : '/tenant/dashboard',
          )
        }
      />

      <div className="flex flex-1 overflow-hidden relative">
        <WizardChatColumn
          className={`w-full lg:w-1/2 flex flex-col bg-white border-r border-slate-200 relative h-full min-h-0 ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
          allMessages={messages}
          status={status}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleFormSubmit}
          onToggleDiffDrawer={() => setShowDiffDrawer((prev) => !prev)}
          showDiffDrawer={showDiffDrawer}
          diffPatches={diffPatches}
          isDirty={isDirty}
          hasPreviousPage={hasPreviousPage}
          isFetchingPreviousPage={isFetchingPreviousPage}
          onLoadPreviousMessages={fetchPreviousPage}
          firstItemIndex={firstItemIndex}
          onNavigateToCanvas={() => handleMobileTabChange('canvas')}
        />

        <div
          className={`w-full lg:w-1/2 flex flex-col bg-slate-50/80 overflow-hidden h-full min-h-0 ${
            mobileTab !== 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <CanvasHeader
            rightViewMode={rightViewMode}
            setRightViewMode={(mode) => {
              setRightViewMode(mode);
              if (mode === 'sandbox') {
                setMobileTab('sandbox');
              } else {
                setMobileTab('canvas');
              }
            }}
            isDirty={isDirty}
            pendingChangesCount={diffPatches.length}
            isSavingChanges={isSavingChanges}
            onSaveChanges={handleSaveChanges}
            isLive={isLive}
          />

          <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6">
            {rightViewMode === 'rules' && (
              <>
                <CanvasFilterTabs
                  canvasModule={canvasModule}
                  setCanvasModule={setCanvasModule}
                  servicesCount={servicesList.length}
                  resourcesCount={resourcesList.length}
                />

                {(canvasModule === 'all' || canvasModule === 'profile') && (
                  <BusinessProfileCard
                    clinicName={clinicName}
                    timezone={timezone}
                    businessProfile={businessProfile}
                    isLive={isLive}
                    dailyHoursText={dailyHoursText}
                    formattedHoursText={formattedHoursText}
                    operatingHours={operatingHours}
                  />
                )}

                {(canvasModule === 'all' || canvasModule === 'scheduling') && (
                  <SchedulingEngineCard schedulingEngine={draftSchema?.scheduling_engine} />
                )}

                {(canvasModule === 'all' || canvasModule === 'services') && (
                  <ServicesCatalogCard
                    servicesList={servicesList}
                    currency={businessProfile.currency || 'USD'}
                  />
                )}

                {(canvasModule === 'all' || canvasModule === 'resources') && (
                  <ResourcesRosterCard resourcesList={resourcesList} />
                )}

                {(canvasModule === 'all' || canvasModule === 'guardrails') && (
                  <SecurityGuardrailsCard
                    guardrails={guardrails}
                    requireOtp={requireOtp}
                    phiScrubbing={phiScrubbing}
                    emergencyTriage={emergencyTriage}
                  />
                )}
              </>
            )}

            {rightViewMode === 'sandbox' && (
              <SandboxSimulation
                clinicName={clinicName}
                tenantId={tenantId}
                agentId={agentId}
                widgetConfig={draftSchema?.widget_config as any}
                isLive={isLive}
              />
            )}

            {rightViewMode === 'json' && (
              <RawJsonViewer
                draftSchema={draftSchema}
                copiedJson={copiedJson}
                onCopyJson={handleCopyJson}
              />
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden bg-white border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around z-30 flex-shrink-0 shadow-lg">
        <button
          type="button"
          onClick={() => handleMobileTabChange('chat')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            mobileTab === 'chat'
              ? 'text-slate-950 font-bold bg-slate-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span className="text-[10px]">Architect</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileTabChange('canvas')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer relative ${
            mobileTab === 'canvas'
              ? 'text-slate-950 font-bold bg-slate-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4" />
            {isDirty && diffPatches.length > 0 && (
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px]">Canvas</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileTabChange('sandbox')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            mobileTab === 'sandbox'
              ? 'text-slate-950 font-bold bg-slate-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span className="text-[10px]">Sandbox</span>
        </button>
      </div>
    </div>
  );
}
