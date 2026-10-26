import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Code2,
  Layers,
  Loader2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { knowledgeApi } from '../api/knowledgeApi.js';
import { useAgentSchemaGeneration } from '../hooks/useAgentSchemaGeneration.js';
import { getOperatingScheduleGroups } from './onboarding/utils';

type ServiceType = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
};

const services: ServiceType[] = [
  {
    id: 'medical',
    title: 'Medical & Dental Clinics',
    description:
      'Doctor shifts, chair sanitization buffers, insurance triage, and HIPAA-compliant patient intake.',
    badge: 'Pre-configured 15m buffers + OTP verify',
    icon: '✚',
  },
  {
    id: 'auto',
    title: 'Auto Repair & Services',
    description:
      'Physical bay & lift allocations, vehicle VIN collection, parts lead times, and diagnostic scaling.',
    badge: 'Equipment & bay constraint modeling',
    icon: '◉',
  },
  {
    id: 'hospitality',
    title: 'Hospitality & Rooms',
    description:
      'Check-in/out date ranges, 4-hour housekeeping turnover blocks, room categories, and guest add-ons.',
    badge: 'Multi-day capacity & turnover blocks',
    icon: '▣',
  },
  {
    id: 'custom',
    title: 'Others / Custom Service',
    description:
      'Salons, legal practices, consulting, or bespoke service models with custom rulesets and buffers.',
    badge: 'Configurable slot math & custom fields',
    icon: '☷',
  },
];

export default function SchedulingOnboarding() {
  const [selected, setSelected] = useState('web_crawl');

  console.log(selected);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const navigate = useNavigate();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null);

  const { startCrawl, isLoading, stage, progressMessage, schema, error, reset } =
    useAgentSchemaGeneration();

  const selectedService = services.find((service) => service.id === selected);

  const handleAutoDetect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;
    startCrawl(websiteUrl);
  };

  const handleConfigureAndSaveDraft = async (source: string) => {
    try {
      setIsSavingDraft(true);
      setSaveDraftError(null);
      const res = await knowledgeApi.saveInitialAgentDraft({
        name: schema?.business_profile?.name || 'AI Scheduling Agent',
        creation_source: source,
      });

      const newAgentId = res?.data?.agent_id;
      if (newAgentId) {
        navigate(`/tenant/agent-setup/${newAgentId}`);
      } else {
        navigate('/tenant/agents');
      }
    } catch (err: unknown) {
      console.error('Failed to save initial agent draft:', err);
      setSaveDraftError(err instanceof Error ? err.message : 'Failed to save agent draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleContinue = () => {
    if (schema) handleConfigureAndSaveDraft('web_crawl');
    else {
      handleConfigureAndSaveDraft(selected);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 h-16 px-6 sm:px-8 flex items-center justify-between">
        {/* Logo & Back button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tenant/agents')}
            className="p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Back to AI Agents Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-950">Schedulux AI</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <div className="flex items-center rounded-full bg-neutral-100/80 p-1 text-sm font-medium">
            <button className="rounded-full bg-white px-5 py-1.5 shadow-sm text-neutral-900 border border-neutral-200/60 font-semibold text-xs">
              Agent Studio
            </button>
            <button
              onClick={() => navigate('/tenant/agents')}
              className="px-5 py-1.5 text-neutral-500 hover:text-neutral-900 transition cursor-pointer text-xs font-medium"
            >
              Agents Dashboard
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium tracking-wide text-emerald-700">
            PRODUCTION
          </span>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-white hover:bg-neutral-800 transition cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
        {/* Step indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-wider text-neutral-500 uppercase shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-950" />
            <span>Step 1 of 2</span>
            <span className="text-neutral-300">•</span>
            <span>Onboarding Studio</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
            What kind of service are you scheduling?
          </h1>
          <p className="mt-4 text-base text-neutral-500 leading-relaxed">
            Auto-generate your business rules from your website via AI, or start with a
            pre-configured template.
          </p>
        </div>

        {/* Website Auto Generate */}
        <section className="rounded-[24px] border border-neutral-200 bg-[#fbfbfb] p-6 sm:p-8 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Auto-generate from your existing site
            </h2>
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Instant AI ingestion
            </span>
          </div>

          <p className="text-sm leading-relaxed text-neutral-500 mb-6 max-w-2xl">
            Paste your website or booking page URL. Schedulux AI will crawl your site, parse staff
            roles, appointment buffers, and generate your custom scheduling schema in real-time.
          </p>

          <form onSubmit={handleAutoDetect} className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 items-center rounded-full border border-neutral-300 bg-white px-5 shadow-xs focus-within:ring-2 focus-within:ring-neutral-950 focus-within:border-transparent transition">
              <span className="mr-3 text-neutral-400 font-bold text-xs">URL</span>
              <input
                value={websiteUrl}
                disabled={isLoading}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://apexdental.com"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-neutral-400 text-neutral-900 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !websiteUrl.trim()}
              className="rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  Auto-Detect Rules
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span className="font-medium text-rose-900 leading-relaxed">{error}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {websiteUrl && (
                  <button
                    type="button"
                    onClick={() => startCrawl(websiteUrl)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-full text-xs shadow-xs transition cursor-pointer"
                  >
                    Try Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 font-medium rounded-full text-xs hover:bg-neutral-100 transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Loading Progress State */}
          {isLoading && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      {stage === 'crawling'
                        ? 'Step 1: Web Crawler Active'
                        : 'Step 2: AI Schema Synthesis'}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{progressMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Schema Display (Real-time via WebSocket) */}
          {schema && stage === 'completed' && (
            <div className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50/30 p-6 shadow-sm animate-in slide-in-from-top-4 duration-400">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-emerald-200/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-neutral-950 text-base">
                        AI Generated Schema Ready
                      </h3>
                      <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Live via Redis
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Inferred from {websiteUrl} & compiled via Schedulux AI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJsonRaw(!showJsonRaw)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer shadow-xs"
                  >
                    <Code2 className="w-3.5 h-3.5 text-neutral-500" />
                    {showJsonRaw ? 'Hide JSON' : 'Inspect JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Business Overview */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Business Profile
                  </span>
                  <p className="text-sm font-bold text-neutral-950 mt-1">
                    {schema?.business_profile?.name || 'Inferred Business'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Vertical:{' '}
                    <span className="font-semibold text-neutral-800 capitalize">
                      {schema?.business_profile?.vertical || 'Service'}
                    </span>{' '}
                    • Timezone: {schema?.business_profile?.timezone || 'Not configured'}
                  </p>
                  {schema?.business_profile?.address && (
                    <p className="text-xs text-neutral-400 mt-2 truncate">
                      📍 {schema?.business_profile?.address}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Operating Hours
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(() => {
                      const groups = getOperatingScheduleGroups(schema?.operating_hours).filter(
                        (g) => g.isOpen,
                      );
                      if (groups.length > 0) {
                        return groups.map((g, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700"
                          >
                            {g.label}: {g.timeText}
                          </span>
                        ));
                      }
                      return (
                        <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700">
                          Standard 08:00 - 17:00
                        </span>
                      );
                    })()}
                    <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Inferred default
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Services */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-500" />
                    Detected Services ({schema?.services?.length || 0})
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Pre-populated into your agent
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {schema?.services?.map((srv, idx: number) => (
                    <div
                      key={srv.service_id || idx}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-neutral-950 truncate">{srv.name}</p>
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-900 shrink-0">
                          ${srv?.price?.amount || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {srv.duration_minutes || 30} mins
                        </span>
                        <span>•</span>
                        <span className="capitalize">{srv.booking_mode || 'time_slot'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON viewer */}
              {showJsonRaw && (
                <div className="mt-5 rounded-xl bg-neutral-950 p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80">
                  <pre>{JSON.stringify(schema, null, 2)}</pre>
                </div>
              )}

              {/* Error message if draft save failed */}
              {saveDraftError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveDraftError}</span>
                </div>
              )}

              {/* Action to proceed with generated schema */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                <span className="text-xs text-neutral-500">
                  Ready to configure? Click below to save this draft to your agents collection.
                </span>
                <button
                  type="button"
                  disabled={isSavingDraft}
                  onClick={handleContinue}
                  className="rounded-full bg-neutral-950 px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving to Agent Drafts...
                    </>
                  ) : (
                    <>
                      <Settings2 className="w-3.5 h-3.5" />
                      Configure / Edit
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Or select a starting template
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        </section>

        {/* Service Cards */}
        <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {services.map((service) => {
            const isSelected = selected === service.id;

            return (
              <button
                key={service.id}
                onClick={() => setSelected(service.id)}
                className={`relative min-h-[180px] rounded-[24px] border p-6 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-neutral-950 bg-white shadow-md ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-[#fbfbfb] hover:border-neutral-300 hover:bg-white'
                }`}
              >
                {/* Recommended Badge */}
                {service.id === 'medical' && (
                  <span className="absolute right-6 top-6 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Recommended
                  </span>
                )}

                {/* Icon */}
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isSelected
                      ? 'bg-neutral-950 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 shadow-sm'
                  } text-xl`}
                >
                  {service.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-neutral-950 mb-2">{service.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500 mb-6 pr-4">
                  {service.description}
                </p>

                {/* Info Badge */}
                <div className="inline-flex rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600">
                  {service.badge}
                </div>
              </button>
            );
          })}
        </section>

        {/* Active selection */}
        <section className="mt-8 rounded-2xl border border-neutral-200 bg-[#fbfbfb] px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="h-2 w-2 rounded-full bg-neutral-950 shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Active Configuration
                </p>
                <p className="text-sm font-bold text-neutral-950 mt-0.5">
                  {schema
                    ? `${schema?.business_profile?.name || 'AI Inferred'} (Live)`
                    : `${selectedService?.title} Template`}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
              <span className="text-rose-500">♡</span> HIPAA Ready Schema & Calm Sync
            </span>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-12 flex flex-col items-center gap-5">
          <button
            onClick={handleContinue}
            className="flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-neutral-950 px-8 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 shadow-md hover:shadow-lg cursor-pointer group"
          >
            {schema ? 'Continue with Inferred Schema' : 'Continue with Template'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              setSelected('custom');
              reset();
              console.log('Starting from blank canvas');
            }}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer group flex items-center gap-1"
          >
            Or start from a blank canvas{' '}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Footer features */}
        <div className="mt-20 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-medium text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            Deterministic availability compiler
          </div>
          <div className="hidden sm:block text-neutral-200">|</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            Zero code required
          </div>
          <div className="hidden sm:block text-neutral-200">|</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            Instant website embed
          </div>
        </div>
      </main>
    </div>
  );
}
