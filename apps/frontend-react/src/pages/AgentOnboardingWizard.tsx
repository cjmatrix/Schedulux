import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { compare, type Operation } from 'fast-json-patch';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';

import { axiosClient } from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';

import type { Message, RightViewMode, CanvasModule } from './onboarding/types';
import { cleanForDiff, getOperatingScheduleGroups } from './onboarding/utils';
import {
  WizardHeader,
  WizardChatColumn,
  CanvasHeader,
  CanvasFilterTabs,
  BusinessProfileCard,
  ServicesCatalogCard,
  ResourcesRosterCard,
  SecurityGuardrailsCard,
  SandboxSimulation,
  RawJsonViewer,
} from './onboarding/components';

export default function AgentOnboardingWizard() {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [draftSchema, setDraftSchema] = useState<any>({});
  const [baselineSchema, setBaselineSchema] = useState<any>(null);
  const [showDiffDrawer, setShowDiffDrawer] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'awaiting_input' | 'processing'>('idle');
  const [isLive, setIsLive] = useState(false);

  const [rightViewMode, setRightViewMode] = useState<RightViewMode>('rules');
  const [canvasModule, setCanvasModule] = useState<CanvasModule>('all');
  const [copiedJson, setCopiedJson] = useState(false);

  const [sandboxMessages, setSandboxMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSandboxTyping, setIsSandboxTyping] = useState(false);

  const hasStartedRef = useRef(false);
  const lastAgentIdRef = useRef<string | null>(null);

  const tenantId = useAuthStore((state) => state.user?.tenant_id);

  const diffPatches: Operation[] = useMemo(() => {
    if (!baselineSchema || !draftSchema) return [];
    try {
      const cleanedBaseline = cleanForDiff(baselineSchema) || {};
      const cleanedDraft = cleanForDiff(draftSchema) || {};
      return compare(cleanedBaseline, cleanedDraft);
    } catch (err) {
      console.error('Error computing schema diffs:', err);
      return [];
    }
  }, [baselineSchema, draftSchema]);

  const isDirty = diffPatches.length > 0;

  useEffect(() => {
    if (!tenantId) return;

    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinRoom', { tenantId });
    });

    socket.on('schema:updated', (payload: any) => {
      if (payload?.tenantId === tenantId && payload?.schema) {
        setDraftSchema(payload.schema);
        if (payload.status === 'live' || payload.schema.status === 'live') {
          setIsLive(true);
          setBaselineSchema(payload.schema);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId]);

  const { data: dbMessages = [] } = useQuery<Message[]>({
    queryKey: ['agent-messages', tenantId, agentId],
    queryFn: async () => {
      if (!tenantId || !agentId) return [];
      const res = await axiosClient.get(`/api/v1/tenant/knowledge/agents/${agentId}/messages`, {
        params: { limit: 50 },
      });
      const msgs = res.data.data?.messages || [];
      return msgs.map((m: any) => ({
        id: m.message_id || m.id,
        role: m.role === 'tenant' ? 'tenant' : 'agent',
        text: m.content || m.text,
      }));
    },
    enabled: !!tenantId && !!agentId,
    refetchInterval: 2000,
  });

  const allMessages = useMemo(() => {
    const dbTexts = new Set(dbMessages.map((m) => m.text.trim()));
    const uniquePending = pendingMessages.filter((pm) => !dbTexts.has(pm.text.trim()));
    return [...dbMessages, ...uniquePending];
  }, [dbMessages, pendingMessages]);

  useEffect(() => {
    if (!tenantId || !agentId) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startSession = async () => {
      setStatus('loading');
      try {
        const res = await axiosClient.post('/api/v1/tenant/knowledge/onboarding/start', {
          tenant_id: tenantId,
          agent_id: agentId,
        });

        const data = res.data.data;
        setDraftSchema(data.draft_schema);
        setBaselineSchema(data.draft_schema);

        const isCompleted =
          data.status === 'complete' ||
          data.draft_schema?.status === 'complete' ||
          data.draft_schema?.status === 'created';

        if (isCompleted) {
          setIsLive(true);
        }

        setStatus('awaiting_input');
      } catch (err) {
        console.error('Failed to start session:', err);
        setStatus('idle');
      }
    };

    startSession();
  }, [tenantId, agentId]);

  const handleSendMessage = async (textToSend?: string) => {
    const userMsg = (textToSend ?? inputValue).trim();
    if (!userMsg || status === 'processing' || status === 'loading') return;

    setInputValue('');
    const userMsgId = 'user-' + Date.now();
    setPendingMessages((prev) => [...prev, { id: userMsgId, role: 'tenant', text: userMsg }]);
    setStatus('processing');

    try {
      const res = await axiosClient.post('/api/v1/tenant/knowledge/onboarding/message', {
        tenant_id: tenantId,
        agent_id: agentId,
        user_answer: userMsg,
      });

      const data = res.data.data;
      setDraftSchema(data.draft_schema);

      const isCompleted =
        data.status === 'complete' ||
        data.draft_schema?.status === 'complete' ||
        data.draft_schema?.status === 'created';

      if (isCompleted) {
        setIsLive(true);
        setBaselineSchema(data.draft_schema);
      }

      setStatus('awaiting_input');

      const agentMsgId = 'agent-' + Date.now();
      if (data.status === 'complete') {
        setPendingMessages((prev) => [
          ...prev,
          {
            id: agentMsgId,
            role: 'agent',
            text:
              data.question ||
              'Your agent configuration is complete and saved to the database. You are ready to go live!',
          },
        ]);
      } else if (data.question) {
        setPendingMessages((prev) => [
          ...prev,
          {
            id: agentMsgId,
            role: 'agent',
            text: data.question,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setStatus('awaiting_input');
      setPendingMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'agent',
          text: 'Encountered an issue compiling changes to the draft canvas. Please rephrase or try again.',
        },
      ]);
    }
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendMessage();
  };

  const handleSaveChanges = async () => {
    if (!tenantId || !agentId || isSavingChanges) return;
    setIsSavingChanges(true);

    try {
      await axiosClient.post('/api/v1/tenant/knowledge/onboarding/message', {
        tenant_id: tenantId,
        agent_id: agentId,
        user_answer: 'deploy live now and finalize configuration',
      });

      const res = await axiosClient.post('/api/v1/tenant/knowledge/onboarding/start', {
        tenant_id: tenantId,
        agent_id: agentId,
      });

      const data = res.data.data;
      if (data?.draft_schema) {
        setDraftSchema(data.draft_schema);
        setBaselineSchema(data.draft_schema);
        setIsLive(true);
      }

      setShowDiffDrawer(false);
    } catch (err) {
      console.error('Failed to publish agent:', err);
    } finally {
      setIsSavingChanges(false);
    }
  };

  const businessProfile = draftSchema?.business_profile || {};
  const clinicName = businessProfile.name || 'AI Scheduling Agent';
  const timezone = businessProfile.timezone || 'UTC';

  const operatingHours = draftSchema?.operating_hours || {};
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

  const rawResources = Array.isArray(draftSchema?.resources) ? draftSchema.resources : [];
  const rawServices = Array.isArray(draftSchema?.services) ? draftSchema.services : [];

  const servicesList = useMemo(() => {
    return rawServices.map((svc: any, idx: number) => {
      const assigned = rawResources.filter((r: any) =>
        Array.isArray(svc.eligible_resource_ids)
          ? svc.eligible_resource_ids.includes(r.resource_id)
          : false
      );
      return {
        ...svc,
        idx,
        assignedStaff: assigned,
      };
    });
  }, [rawServices, rawResources]);

  const resourcesList = useMemo(() => {
    return rawResources.map((res: any, idx: number) => {
      const handled = rawServices.filter((s: any) =>
        Array.isArray(s.eligible_resource_ids)
          ? s.eligible_resource_ids.includes(res.resource_id)
          : false
      );
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
    false
  );
  const phiScrubbing = Boolean(guardrails?.phi_scrubbing?.enabled);
  const emergencyTriage = Boolean(guardrails?.triage_emergency?.enabled);

  useEffect(() => {
    if (sandboxMessages.length === 0) {
      setSandboxMessages([
        {
          role: 'agent',
          text: `Hello! Welcome to ${clinicName}. I'm your AI booking coordinator. How can I assist you with scheduling or consultations today?`,
        },
      ]);
    }
  }, [clinicName]);

  useEffect(() => {
    if (agentId !== lastAgentIdRef.current) {
      lastAgentIdRef.current = agentId || null;
      setSandboxMessages([]);
    }
  }, [agentId]);

  const handleSendSandboxMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxInput.trim() || isSandboxTyping) return;

    const userText = sandboxInput.trim();
    setSandboxInput('');
    setSandboxMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSandboxTyping(true);

    try {
      const res = await axiosClient.post('/api/v1/tenant/knowledge/onboarding/sandbox', {
        tenant_id: tenantId,
        agent_id: agentId,
        message: userText,
      });

      const reply =
        res.data.data?.reply ||
        `I would be happy to help you with that at ${clinicName}! According to our current scheduling policy, appointments are booked based on provider availability.`;

      setSandboxMessages((prev) => [...prev, { role: 'agent', text: reply }]);
    } catch {
      setSandboxMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `I'd be happy to assist you! For ${clinicName}, please let me know your preferred day and time.`,
        },
      ]);
    } finally {
      setIsSandboxTyping(false);
    }
  };

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
          allMessages={allMessages}
          status={status}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleFormSubmit}
          onToggleDiffDrawer={() => setShowDiffDrawer((prev) => !prev)}
          showDiffDrawer={showDiffDrawer}
          diffPatches={diffPatches}
          isDirty={isDirty}
        />

    
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
                    currency={businessProfile.currency}
                  />
                )}

                {(canvasModule === 'all' || canvasModule === 'resources') && (
                  <ResourcesRosterCard resourcesList={resourcesList} />
                )}

                {(canvasModule === 'all' || canvasModule === 'guardrails') && (
                  <SecurityGuardrailsCard
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
