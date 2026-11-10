import {
  AlertCircle,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Globe,
  Info,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTenantAgents } from '../hooks/useKnowledgeDocuments';
import { useUpdateWidgetConfig, useWidgetConfig } from '../hooks/useWidgetConfig';

type IntegrationTab = 'html' | 'react' | 'wordpress' | 'webflow' | 'shopify';
type EmbedDisplayMode = 'bubble' | 'inline';

export default function EmbedWidgetPage() {
  const navigate = useNavigate();
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const authUser = useAuthStore((state) => state.user);
  const tenantId = authUser?.tenant_id || '';

  const { data: agents = [], isLoading: agentsLoading } = useTenantAgents();

  // Selected agent selection logic
  const selectedAgentId = useMemo(() => {
    if (routeAgentId && agents.some((a) => a.agent_id === routeAgentId)) {
      return routeAgentId;
    }
    return agents[0]?.agent_id || '';
  }, [routeAgentId, agents]);

  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.agent_id === selectedAgentId);
  }, [agents, selectedAgentId]);

  const { data: configData, isLoading: configLoading, refetch } = useWidgetConfig(selectedAgentId);
  const updateConfigMutation = useUpdateWidgetConfig(selectedAgentId);

  // Local state for Whitelisted Domains
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Embed Mode: Floating Bubble vs Inline Container
  const [embedMode, setEmbedMode] = useState<EmbedDisplayMode>('bubble');
  const [activeTab, setActiveTab] = useState<IntegrationTab>('html');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Sync loaded whitelisted domains from remote config
  useEffect(() => {
    if (configData?.widget_config?.whitelisted_domains) {
      setDomains(configData.widget_config.whitelisted_domains);
    } else {
      setDomains([]);
    }
  }, [configData]);

  const handleSelectAgent = (newId: string) => {
    navigate(`/tenant/agents/${newId}/widget`);
  };

  const handleAddDomain = () => {
    const trimmed = newDomainInput.trim().toLowerCase();
    if (!trimmed) return;

    // Basic URL/hostname cleanup
    let cleaned = trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleaned) {
      setDomainError('Please enter a valid website origin or domain');
      return;
    }

    if (domains.includes(cleaned)) {
      setDomainError('This origin is already in your allowed list');
      return;
    }

    setDomains((prev) => [...prev, cleaned]);
    setNewDomainInput('');
    setDomainError(null);
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains((prev) => prev.filter((d) => d !== domainToRemove));
  };

  const handleSaveDomains = () => {
    if (!selectedAgentId) return;

    updateConfigMutation.mutate(
      {
        whitelisted_domains: domains,
      },
      {
        onSuccess: () => {
          setSaveSuccessMsg(true);
          setTimeout(() => setSaveSuccessMsg(false), 3000);
          refetch();
        },
      },
    );
  };

  const customerGatewayUrl =
    import.meta.env.VITE_CUSTOMER_GATEWAY_URL || 'http://localhost:5001';
  const widgetScriptUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/widget.js`
      : 'https://cdn.schedulux.io/widget.js';

  // Generated Script Tags
  const bubbleScriptSnippet = `<!-- Schedulux AI Booking Widget -->
<script
  src="${widgetScriptUrl}"
  data-tenant-id="${tenantId}"
  data-agent-id="${selectedAgentId}"
  data-api-base="${customerGatewayUrl}"
  defer
></script>`;

  const inlineScriptSnippet = `<!-- Schedulux AI Booking Widget (Inline) -->
<div id="schedulux-chat-container" style="width: 100%; height: 650px; max-width: 480px; margin: 0 auto;"></div>

<script
  src="${widgetScriptUrl}"
  data-tenant-id="${tenantId}"
  data-agent-id="${selectedAgentId}"
  data-api-base="${customerGatewayUrl}"
  data-container="#schedulux-chat-container"
  data-inline="true"
  defer
></script>`;

  const currentSnippet = embedMode === 'bubble' ? bubbleScriptSnippet : inlineScriptSnippet;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  // React / Next.js snippet
  const reactSnippet = `import { useEffect } from 'react';

export default function AppointmentChatWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${widgetScriptUrl}';
    script.setAttribute('data-tenant-id', '${tenantId}');
    script.setAttribute('data-agent-id', '${selectedAgentId}');
    script.setAttribute('data-api-base', '${customerGatewayUrl}');
    ${embedMode === 'inline' ? `script.setAttribute('data-container', '#schedulux-chat-container');\n    script.setAttribute('data-inline', 'true');` : ''}
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup widget instance on component unmount
      if (window.ScheduluxWidget) {
        window.ScheduluxWidget.destroy('${tenantId}', '${selectedAgentId}');
      }
      script.remove();
    };
  }, []);

  return ${
    embedMode === 'inline'
      ? `<div id="schedulux-chat-container" style={{ width: '100%', height: '650px' }} />;`
      : `null;`
  }
}`;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Embed Chat Widget</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Deploy your autonomous AI booking agent directly onto your website with instant client-side isolation and CORS security.
          </p>
        </div>

        {/* Agent Selector Dropdown */}
        <div className="flex items-center gap-3">
          {selectedAgent && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedAgent.status === 'created'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedAgent.status === 'created' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {selectedAgent.status === 'created' ? 'Live Agent' : 'Draft Mode'}
            </span>
          )}
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Selected Agent:
          </label>
          <div className="relative min-w-[220px]">
            <select
              value={selectedAgentId}
              onChange={(e) => handleSelectAgent(e.target.value)}
              disabled={agentsLoading || agents.length === 0}
              className="w-full appearance-none bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-2.5 pr-10 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
            >
              {agents.map((ag) => (
                <option key={ag.agent_id} value={ag.agent_id}>
                  {ag.name || ag.agent_id} ({ag.status === 'created' ? 'Live' : 'Draft'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Embed Code & Guides) | Right Column (CORS Origins & Security) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Embed Code & Platform Guides (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Display Mode Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              1. Choose Widget Display Mode
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select how your customers will interact with the booking assistant on your website.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <button
                type="button"
                onClick={() => setEmbedMode('bubble')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  embedMode === 'bubble'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">Floating Chat Bubble</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      embedMode === 'bubble' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {embedMode === 'bubble' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pins a compact launcher button to the bottom corner of your page. Opens an interactive chat window on click.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEmbedMode('inline')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  embedMode === 'inline'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">Inline Embedded Container</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      embedMode === 'inline' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {embedMode === 'inline' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Embeds the chat interface directly inside any designated section, column, or hero block on your landing page.
                </p>
              </button>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                2. Copy Your Embed Snippet
              </h2>
              <button
                type="button"
                onClick={handleCopySnippet}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copiedSnippet
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                <code>{currentSnippet}</code>
              </pre>
            </div>

            {/* Explanation of parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">data-tenant-id</span>
                <span className="text-slate-500 font-mono text-[11px] truncate block">
                  {tenantId || 'Not signed in'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">data-agent-id</span>
                <span className="text-slate-500 font-mono text-[11px] truncate block">
                  {selectedAgentId || 'No agent selected'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">data-api-base</span>
                <span className="text-slate-500 font-mono text-[11px] truncate block">
                  {customerGatewayUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Installation & Platform Guides */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              3. Platform Integration Guides
            </h2>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
              {(
                [
                  { id: 'html', label: 'HTML / Webflow' },
                  { id: 'react', label: 'React / Next.js' },
                  { id: 'wordpress', label: 'WordPress' },
                  { id: 'shopify', label: 'Shopify' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {activeTab === 'html' && (
              <div className="flex flex-col gap-3 text-xs text-slate-600">
                <p>
                  Paste the embed snippet directly inside the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">&lt;body&gt;</code> section of your website, ideally right before the closing <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">&lt;/body&gt;</code> tag.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    The script loads asynchronously and renders completely inside an isolated <strong>Shadow DOM</strong>, preventing CSS style leakage or conflicts with your site's styles.
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'react' && (
              <div className="flex flex-col gap-3 text-xs">
                <p className="text-slate-600">
                  Mount the widget using a custom React hook or <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">useEffect</code> block in your Next.js / Vite application:
                </p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                  <code>{reactSnippet}</code>
                </pre>
              </div>
            )}

            {activeTab === 'wordpress' && (
              <div className="flex flex-col gap-3 text-xs text-slate-600">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>In your WordPress Admin Dashboard, navigate to <strong>Plugins &rarr; Add New</strong>.</li>
                  <li>Search for and install <strong>WPCode</strong> (or any "Insert Headers and Footers" plugin).</li>
                  <li>Navigate to <strong>Code Snippets &rarr; Header &amp; Footer</strong>.</li>
                  <li>Paste the Schedulux script snippet into the <strong>Footer</strong> input box and click <strong>Save Changes</strong>.</li>
                </ol>
              </div>
            )}

            {activeTab === 'shopify' && (
              <div className="flex flex-col gap-3 text-xs text-slate-600">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>In your Shopify admin, go to <strong>Online Store &rarr; Themes</strong>.</li>
                  <li>Click the three dots next to your current theme and choose <strong>Edit code</strong>.</li>
                  <li>Locate and open the <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">theme.liquid</code> file.</li>
                  <li>Paste the script snippet just before the closing <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">&lt;/body&gt;</code> tag and click <strong>Save</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: CORS Whitelist & Security Settings (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Allowed Website Origins (CORS Security) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Allowed Website Origins (CORS)</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {domains.length} configured
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Restrict which websites are authorized to embed this agent and connect to the Customer API Gateway. Prevents unauthorized third parties from embedding your bot or using your quotas.
            </p>

            {/* Input to add new domain */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Add Origin or Hostname</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. myclinic.com, https://app.example.com, or *"
                  value={newDomainInput}
                  onChange={(e) => {
                    setNewDomainInput(e.target.value);
                    setDomainError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="inline-flex items-center gap-1 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {domainError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{domainError}</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions for Local Development */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
              <span>Quick add:</span>
              <button
                type="button"
                onClick={() => {
                  if (!domains.includes('localhost:5173')) {
                    setDomains((prev) => [...prev, 'localhost:5173']);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                localhost:5173
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!domains.includes('localhost:3000')) {
                    setDomains((prev) => [...prev, 'localhost:3000']);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                localhost:3000
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!domains.includes('*')) {
                    setDomains((prev) => [...prev, '*']);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                * (Allow all)
              </button>
            </div>

            {/* Active Domains List */}
            <div className="flex flex-col gap-2 mt-1">
              <label className="text-xs font-semibold text-slate-700">Active Whitelist</label>
              {domains.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                  <Lock className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">No origins restricted yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When whitelist is empty, any domain can initialize the widget. Add your production domain to enforce protection.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {domains.map((domain) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-800 font-medium truncate">{domain}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove domain"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {saveSuccessMsg ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Origins saved successfully!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {configLoading ? 'Loading config...' : 'Changes take effect immediately.'}
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveDomains}
                disabled={updateConfigMutation.isPending || !selectedAgentId}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {updateConfigMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Allowed Origins
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Architecture Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold">Split Gateway Architecture</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your public customer chat runs on a dedicated high-throughput microservice gateway (<code className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-indigo-300">port 5001</code>), isolating unauthenticated customer traffic from your authenticated tenant administration gateway (<code className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-indigo-300">port 5000</code>).
            </p>
            <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
              <div>&bull; HMAC-signed stateless session verification</div>
              <div>&bull; Low-latency Redis business context caching</div>
              <div>&bull; Strict preflight &amp; origin whitelisting</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
