import type { ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
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
    sandboxMessages,
    setSandboxMessages,
    sandboxInput,
    setSandboxInput,
    isSandboxTyping,
    sendSandboxMessage,
    resetSandbox,
  } = useAgentOnboarding({ agentId });

  const [showDiffDrawer, setShowDiffDrawer] = useState(false);
  const [rightViewMode, setRightViewMode] = useState<RightViewMode>('rules');
  const [canvasModule, setCanvasModule] = useState<CanvasModule>('all');
  const [copiedJson, setCopiedJson] = useState(false);

  const businessProfile = draftSchema?.business_profile || {};
  const clinicName = businessProfile.name || 'AI Scheduling Agent';
  const timezone = businessProfile.timezone || '';
  const operatingHours = draftSchema?.operating_hours || {};


  useEffect(() => {
    if (sandboxMessages.length === 0) {
      setSandboxMessages([
        {
          role: 'agent',
          text: `Hello! Welcome to ${clinicName}. I'm your AI booking coordinator. How can I assist you with scheduling or consultations today?`,
        },
      ]);
    }
  }, [clinicName, sandboxMessages.length, setSandboxMessages]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessage();
  };

  const handleSaveChanges = async () => {
    await saveChanges();
    setShowDiffDrawer(false);
  };

  const handleSendSandboxMessage = (e: React.FormEvent) => {
    sendSandboxMessage(e, clinicName);
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

  const rawResources = (
    Array.isArray(draftSchema?.resources) ? draftSchema.resources : []
  ).filter((r: any) => !r.is_deleted);
  const rawServices = (
    Array.isArray(draftSchema?.services) ? draftSchema.services : []
  ).filter((s: any) => !s.is_deleted);

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
  const requireOtp = Boolean(
    guardrails?.verification_policy?.require_otp_for_reschedule ??
      guardrails?.verification_policy?.require_otp_for_new_booking ??
      false,
  );
  const phiScrubbing = Boolean(guardrails?.phi_scrubbing?.enabled);
  const emergencyTriage = Boolean(guardrails?.triage_emergency?.enabled);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(draftSchema, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100/70 text-slate-900 font-sans antialiased overflow-hidden select-none">
      {/* ── TOP APPLICATION HEADER ── */}
      <WizardHeader
        onNavigateAgents={() => navigate('/tenant/agents')}
        onNavigateDashboard={() => navigate('/tenant/dashboard')}
        onNavigateProfile={() => navigate('/tenant/profile')}
      />

      {/* ── MAIN WORKSPACE BODY (SPLIT VIEW) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: CONVERSATIONAL AGENT ARCHITECT */}
        <WizardChatColumn
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
        />

        {/* RIGHT COLUMN: SCHEMA CANVASES & TEST SIMULATOR */}
        <div className="w-1/2 flex flex-col bg-slate-50/80 overflow-hidden">
          {/* Canvas Subheader / Mode Switcher */}
          <CanvasHeader
            rightViewMode={rightViewMode}
            setRightViewMode={setRightViewMode}
            isDirty={isDirty}
            pendingChangesCount={diffPatches.length}
            isSavingChanges={isSavingChanges}
            onSaveChanges={handleSaveChanges}
          />

          {/* Canvas Scroll Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* VIEW MODE 1: LOGIC & RULES CANVAS */}
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

            {/* VIEW MODE 2: TEST SANDBOX SIMULATION */}
            {rightViewMode === 'sandbox' && (
              <SandboxSimulation
                clinicName={clinicName}
                sandboxMessages={sandboxMessages}
                setSandboxMessages={setSandboxMessages}
                sandboxInput={sandboxInput}
                setSandboxInput={setSandboxInput}
                isSandboxTyping={isSandboxTyping}
                onSendSandboxMessage={handleSendSandboxMessage}
                onResetSandbox={() =>
                  resetSandbox(
                    `Hello! Welcome to ${clinicName}. I'm your AI booking coordinator. How can I assist you with scheduling or consultations today?`,
                  )
                }
              />
            )}

            {/* VIEW MODE 3: RAW JSON SCHEMA */}
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
    </div>
  );
}
