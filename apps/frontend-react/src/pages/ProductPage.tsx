import {
  ArrowRight,
  Bot,
  Calendar,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/PublicLayout';

const BUILDER_STEPS = [
  {
    step: '01',
    title: 'Paste Your Website URL or Pick a Template',
    desc: 'Our smart website scanner reads your public service, pricing, and hours pages and turns them into a ready-to-review booking setup—flagging any details it had to estimate.',
    icon: Globe,
  },
  {
    step: '02',
    title: 'Customize on the Visual Canvas',
    desc: 'Chat with your AI setup assistant in plain English while watching your Services, Staff, Shifts, and Safety Rules update live on the right. Undo any change with 20-step history.',
    icon: Layers,
  },
  {
    step: '03',
    title: 'Test Everything in Your Private Sandbox',
    desc: 'Chat with your assistant before customers ever see it. Test real slot holds, SMS verification codes, and answers from your uploaded PDFs.',
    icon: Play,
  },
  {
    step: '04',
    title: 'Go Live with One Line of Code',
    desc: 'Publish your assistant in one click, paste a single line onto your website (or share your hosted booking link), and start taking verified bookings 24/7.',
    icon: Zap,
  },
];

export default function ProductPage() {
  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-24">
        {/* Hero */}
        <section className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Agent Builder Studio
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950 leading-[1.08]">
            An AI assistant that sets up, tests, and runs your bookings
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed">
            Generic chatbots can only answer basic questions. Schedulux gives you a visual studio
            to build a real booking assistant—connected to your live staff calendars, rooms, SMS
            verification, and policy PDFs.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/register"
              className="rounded-full bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition inline-flex items-center gap-2"
            >
              Build your agent free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/docs"
              className="rounded-full border border-neutral-200 text-neutral-800 px-6 py-3 text-sm font-medium hover:bg-neutral-50 transition"
            >
              See Widget Embed Guide
            </Link>
          </div>
        </section>

        {/* 4-Step Builder Studio */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              How the Agent Builder Studio works
            </h2>
            <p className="mt-2 text-sm text-neutral-500 max-w-2xl">
              Go from your existing website to a live 24/7 booking concierge in minutes—no coding
              or complex forms required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BUILDER_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-3xl border border-neutral-200 bg-[#fafaf9] p-7 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-400">
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-950">{item.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Smart Customer Conversations */}
        <section className="rounded-[32px] border border-neutral-200 bg-neutral-950 text-white p-8 sm:p-12 space-y-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Bot className="w-4 h-4" />
              Smart Customer Concierge
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Handles questions and bookings in the same breath
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              When a customer asks{' '}
              <em>&ldquo;What is your cancellation policy and do you have Friday 2pm open?&rdquo;</em>
              , Schedulux answers the policy from your PDFs and checks live calendar availability at
              the same time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-2.5">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base">Instant Guardrails</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Urgent or emergency keywords immediately display your custom safety instructions and
                direct phone number—never left to AI guesswork.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base">Timezone-Smart Booking</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Understands natural phrases like &ldquo;next Tuesday morning&rdquo; in your exact
                business timezone and sends clean confirmation cards.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-2.5">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base">Always in Sync</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Update a price, add a staff member, or block a holiday in your dashboard and your AI
                assistant reflects it immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Scheduling & Knowledge Base */}
        <section id="scheduling" className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-28">
          <div className="rounded-3xl border border-neutral-200 p-8 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-neutral-950">
              Zero-Overlap Scheduling Engine
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Supports both hourly appointments and multi-day stays or rentals. Automatically
              enforces minimum advance notice, prep/cleanup buffers, holiday closures, and
              combined staff + room availability.
            </p>
            <ul className="space-y-2 text-xs text-neutral-600 pt-2">
              <li>• 10-minute temporary slot holds during checkout</li>
              <li>• Instant confirmation with zero double-bookings</li>
              <li>• Self-service reschedule &amp; cancellation protected by SMS code</li>
            </ul>
          </div>

          <div id="rag" className="rounded-3xl border border-neutral-200 p-8 space-y-4 scroll-mt-28">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-neutral-950">
              Private Business Knowledge Base
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Upload your pricing sheets, intake checklists, or policy PDFs—including complex
              tables. Your assistant answers strictly from your approved business documents.
            </p>
            <ul className="space-y-2 text-xs text-neutral-600 pt-2">
              <li>• Preserves pricing tables and structured policy details</li>
              <li>• Strictly isolated to your workspace and individual agent</li>
              <li>• Never leaks data or answers from other businesses</li>
            </ul>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
