import { Code2, Globe, Palette, Terminal } from 'lucide-react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/PublicLayout';

const FLOATING_SNIPPET = `<script
  src="https://app.schedulux.xyz/widget.js"
  data-tenant-id="tnt_your_tenant_id"
  data-agent-id="agent_your_agent_id"
  defer
></script>`;

const INLINE_SNIPPET = `<div id="schedulux-booking"></div>
<script
  src="https://app.schedulux.xyz/widget.js"
  data-tenant-id="tnt_your_tenant_id"
  data-agent-id="agent_your_agent_id"
  data-container="schedulux-booking"
  data-inline="true"
  defer
></script>`;

const JS_API_SNIPPET = `// Imperative control from your web app
window.ScheduluxWidget.open();
window.ScheduluxWidget.sendMessage('Do you have availability tomorrow?');
window.ScheduluxWidget.updateConfig({
  theme: { primary_color: '#0F172A', theme_mode: 'dark' }
});`;

export default function DocsPage() {
  return (
    <PublicLayout>
      <main className="max-w-5xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-16">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            Widget &amp; Integration Docs
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950">
            Deploy your booking agent in 60 seconds
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed max-w-2xl">
            The <code className="font-mono text-sm text-neutral-800">@repo/widget</code> bundle
            runs inside an isolated Shadow DOM with OKLCH perceptual theming, WCAG AA contrast
            checks, and SSE token streaming.
          </p>
        </section>

        {/* Option 1: Floating Bubble */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-950">
            1. Floating Chat Widget (Recommended)
          </h2>
          <p className="text-sm text-neutral-600">
            Paste this single line before <code className="font-mono text-xs">&lt;/body&gt;</code>{' '}
            on HTML, WordPress (WPCode), Shopify (<code className="font-mono text-xs">theme.liquid</code>
            ), or React/Next.js:
          </p>
          <pre className="rounded-2xl bg-neutral-950 text-neutral-100 p-5 text-xs font-mono overflow-x-auto leading-relaxed">
            {FLOATING_SNIPPET}
          </pre>
        </section>

        {/* Option 2: Inline Embed */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-950">2. Inline Page Container</h2>
          <p className="text-sm text-neutral-600">
            Render the booking concierge directly inside a dedicated section on your booking page:
          </p>
          <pre className="rounded-2xl bg-neutral-950 text-neutral-100 p-5 text-xs font-mono overflow-x-auto leading-relaxed">
            {INLINE_SNIPPET}
          </pre>
        </section>

        {/* Option 3: Programmatic API */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-neutral-950" />
            <h2 className="text-xl font-bold text-neutral-950">3. Programmatic JavaScript API</h2>
          </div>
          <pre className="rounded-2xl bg-neutral-950 text-neutral-100 p-5 text-xs font-mono overflow-x-auto leading-relaxed">
            {JS_API_SNIPPET}
          </pre>
        </section>

        {/* Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="rounded-3xl border border-neutral-200 p-6 space-y-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-neutral-950">OKLCH Theme &amp; Shadow DOM</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Host site CSS never leaks into the widget, and widget styles never affect your site.
              Light, dark, and auto color modes are automatically contrast-checked.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 p-6 space-y-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-neutral-950">Standalone Hosted Link + CORS Guard</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              No website yet? Share{' '}
              <code className="font-mono">/chat/:tenantId/:agentId</code> directly, or whitelist
              your domains in the dashboard Embed page.
            </p>
          </div>
        </section>

        <div className="pt-4">
          <Link
            to="/register"
            className="rounded-full bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition inline-block"
          >
            Get your embed snippet free
          </Link>
        </div>
      </main>
    </PublicLayout>
  );
}
