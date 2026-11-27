import {
  Activity,
  Database,
  Globe,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/PublicLayout';

const ISOLATION_LAYERS = [
  {
    layer: 'Separate Admin & Customer Traffic',
    detail:
      'Your internal business dashboard and your public website chat widget run on completely separate gateways—so high customer traffic never slows down your team.',
  },
  {
    layer: 'Authorized Website Protection',
    detail:
      'Only domains you explicitly approve in your dashboard can load your booking widget, blocking unauthorized third-party embeds.',
  },
  {
    layer: 'Private Knowledge Base Per Business',
    detail:
      'Your uploaded PDFs and scanned website pages are strictly isolated to your workspace and agent—never shared or mixed with any other business.',
  },
  {
    layer: 'Strict Account Boundaries',
    detail:
      'Every booking, customer record, and schedule is scoped to your workspace ID across all storage and caching layers.',
  },
];

export default function SecurityPage() {
  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-20">
        <section className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security, Reliability &amp; Privacy
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950 leading-[1.08]">
            Built to protect your calendar, your clients, and your business data
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed">
            Designed for service businesses that cannot afford double-bookings, fake spam
            appointments, or mixed-up client information.
          </p>
        </section>

        {/* 3-Layer Double-Booking Prevention */}
        <section className="rounded-[32px] border border-neutral-200 bg-[#fafaf9] p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-neutral-950" />
            <h2 className="text-2xl font-bold text-neutral-950">
              3-Layer Double-Booking Protection
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-neutral-200 p-6 space-y-2">
              <span className="text-xs font-bold text-indigo-600">STEP 1</span>
              <h3 className="font-bold text-neutral-950">10-Minute Slot Hold</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                As soon as a customer picks a time, Schedulux temporarily holds the staff member and
                room/bay while they enter their SMS verification code.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-neutral-200 p-6 space-y-2">
              <span className="text-xs font-bold text-emerald-600">STEP 2</span>
              <h3 className="font-bold text-neutral-950">Live Conflict Check</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Before showing open times, the calendar excludes existing bookings, holiday
                closures, prep buffers, and slots currently held by other visitors.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-neutral-200 p-6 space-y-2">
              <span className="text-xs font-bold text-amber-600">STEP 3</span>
              <h3 className="font-bold text-neutral-950">Guaranteed Final Lock</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Even if two visitors click confirm at the exact same millisecond, database-level
                uniqueness guarantees only one booking succeeds.
              </p>
            </div>
          </div>
        </section>

        {/* Multi-Tenant Isolation */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-neutral-950" />
            <h2 className="text-2xl font-bold text-neutral-950">Your Data Stays Yours</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ISOLATION_LAYERS.map((item) => (
              <div
                key={item.layer}
                className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-2"
              >
                <h3 className="font-bold text-base text-neutral-950">{item.layer}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Auth, OTP & Guardrails */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-neutral-200 p-7 space-y-3">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-neutral-950">SMS Phone Verification</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              6-digit SMS verification codes confirm real phone numbers before booking,
              rescheduling, or cancelling—blocking spam and no-shows.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 p-7 space-y-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-lg text-neutral-950">Emergency &amp; Privacy Rules</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Instant keyword detection triggers your custom emergency instructions and reception
              phone number, alongside configurable privacy scrubbing for clinics.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 p-7 space-y-3">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-neutral-950">Team Access Controls</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Invite managers with access limited to specific agents, backed by encrypted sessions
              and automatic token rotation.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-neutral-950 text-white p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Activity className="w-4 h-4" />
              Ready to test in a private sandbox?
            </div>
            <p className="text-sm text-neutral-300">
              Create your free workspace and configure your safety rules, SMS verification, and
              approved domains.
            </p>
          </div>
          <Link
            to="/register"
            className="rounded-full bg-white text-neutral-950 px-6 py-2.5 text-xs font-bold hover:bg-neutral-200 transition shrink-0 inline-flex items-center gap-2"
          >
            <Globe className="w-3.5 h-3.5" />
            Get Started Free
          </Link>
        </section>
      </main>
    </PublicLayout>
  );
}
