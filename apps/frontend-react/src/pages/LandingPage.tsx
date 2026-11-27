import {
  ArrowRight,
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  FileText,
  Lock,
  Scissors,
  ShieldCheck,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PublicLayout } from '../components/PublicLayout';
import { useAuthStore } from '../store/useAuthStore';

interface VerticalData {
  name: string;
  dotColor: string;
  category: string;
  builderPrompt: string;
  builderReply: string;
  canvas: {
    serviceName: string;
    duration: string;
    buffer: string;
    resources: string;
    guardrail: string;
  };
  simulation: {
    customerMessage: string;
    intentBadge: string;
    agentResponse: string;
    systemAction: string;
  };
}

const VERTICALS: Record<string, VerticalData> = {
  consulting: {
    name: 'Consulting & Studios',
    dotColor: 'bg-indigo-500',
    category: 'Professional Services & Advisory',
    builderPrompt:
      'Add a 60m Strategy Audit with Sarah in Executive Suite 2, 15m prep buffer, and require SMS verification.',
    builderReply:
      'Updated your Services, Staff & Rooms, and Booking Rules. Ready to test in your sandbox.',
    canvas: {
      serviceName: 'Strategy Audit (60m)',
      duration: '60 min',
      buffer: '15 min buffer',
      resources: 'Sarah M. + Executive Suite 2',
      guardrail: 'SMS Verification • 10m Slot Hold',
    },
    simulation: {
      customerMessage:
        'Hi, I need a 60-minute strategy audit session with Sarah next Tuesday morning.',
      intentBadge: 'Appointment Booking',
      agentResponse:
        'Sarah has an opening next Tuesday at 10:00 AM in Executive Suite 2 (with a 15-minute prep buffer). I am holding this time for 10 minutes—may I send a 6-digit verification code to your phone?',
      systemAction: '10-Minute Slot Hold • Sarah M. + Suite 2 Reserved',
    },
  },
  salons: {
    name: 'Salons & Wellness',
    dotColor: 'bg-rose-500',
    category: 'Salons, Spas & Personal Care',
    builderPrompt:
      'Configure Balayage & Blowout (135m) with Elena at Station Chair 4, and let clients pick their stylist.',
    builderReply:
      'Updated your Services and Stylist Roster with client-selectable booking.',
    canvas: {
      serviceName: 'Balayage & Blowout (135m)',
      duration: '135 min',
      buffer: '15 min turnover',
      resources: 'Elena R. + Station Chair 4',
      guardrail: 'Pick Your Stylist • 10m Slot Hold',
    },
    simulation: {
      customerMessage: 'I would like a balayage and blowout with Elena next Saturday afternoon.',
      intentBadge: 'Stylist Selection',
      agentResponse:
        'Elena has an opening next Saturday at 2:00 PM at Station Chair 4. Shall I hold this 135-minute slot and send your 6-digit SMS verification code?',
      systemAction: '10-Minute Slot Hold • Elena R. + Chair 4 Reserved',
    },
  },
  auto: {
    name: 'Auto & Repair Bays',
    dotColor: 'bg-emerald-500',
    category: 'Auto Repair & Service Bays',
    builderPrompt:
      'Add Brake Pad Service (90m) requiring both Senior Tech Marco and Lift Bay 3.',
    builderReply:
      'Configured combined technician + service bay scheduling and synced your live calendar.',
    canvas: {
      serviceName: 'Brake Pad Service (90m)',
      duration: '90 min',
      buffer: '10 min bay reset',
      resources: 'Tech Marco V. + Lift Bay 3',
      guardrail: 'Tech + Bay Lock • SMS Verified',
    },
    simulation: {
      customerMessage: 'My sedan needs brake pad replacement and inspection before Friday.',
      intentBadge: 'Technician + Bay',
      agentResponse:
        'Senior Technician Marco is available Thursday at 9:00 AM with Lift Bay 3. Would you like me to hold this slot and send an SMS verification code?',
      systemAction: 'Combined Slot Hold • Marco V. + Lift Bay 3 Reserved',
    },
  },
};

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does the customer chat widget embed on my website?',
    answer:
      'You copy a single-line script tag into your website HTML footer. The widget supports custom branding (theme colors, custom greeting, avatar, launcher style, and position) and enforces strict domain whitelisting (CORS) so only your authorized domains can load your booking assistant.',
  },
  {
    question: 'How does Schedulux guarantee zero double-bookings?',
    answer:
      'Unlike generic AI chatbots that guess availability, Schedulux runs on a deterministic reservation engine. During the conversation, it checks live availability against business hours, staff shift schedules, and buffer times, holding a temporary lock on the candidate time slot in RAM until the appointment is committed.',
  },
  {
    question: 'How does SMS OTP verification protect my calendar and bookings?',
    answer:
      'Schedulux integrates with Twilio SMS to dispatch 6-digit verification codes. Customers must verify their phone number before confirming new appointments, cancelling, or rescheduling. Once verified in an active session, customers can view their past and upcoming appointments without repetitive verification.',
  },
  {
    question: 'Can an appointment require both a staff member and an equipment room/bay?',
    answer:
      'Yes. Schedulux has built-in multi-resource scheduling. A service can require both a human specialist (e.g., consultant, stylist, technician, practitioner) and a physical facility/asset (e.g., meeting suite, styling chair, hoist bay, treatment room), ensuring neither the person nor the room is ever double-booked.',
  },
  {
    question: 'How does the PDF Knowledge Base work with the AI agent?',
    answer:
      'You can upload your service guidelines, pricing guides, intake sheets, or policy PDFs. Schedulux indexes them using Voyage AI embeddings and Qdrant vector search. When customers ask about rules, pricing, or procedures, the agent answers with zero hallucination grounded strictly in your documents.',
  },
  {
    question: 'What happens when a customer has an emergency or complex inquiry?',
    answer:
      'You can configure emergency and human handoff guardrails in your dashboard. If a customer reports urgent issues or triggers a designated emergency topic, the agent immediately provides your emergency message and directs them to your reception phone contact.',
  },
  {
    question: 'Can I customize scheduling rules, durations, and buffer times?',
    answer:
      'Yes. Schedulux gives you full control over your scheduling rules. You can configure custom appointment durations, required buffer/prep intervals between bookings, maximum advance notice, booking horizons, operating hours, and blackout holiday dates per service and resource.',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [activeVertical, setActiveVertical] = useState<'consulting' | 'salons' | 'auto'>(
    'consulting',
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');

  const currentVertical = VERTICALS[activeVertical];

  const handleGenerateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;
    if (isAuthenticated) {
      navigate(`/tenant/landingboard?url=${encodeURIComponent(websiteUrl.trim())}`);
    } else {
      navigate('/register');
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-24">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-bold tracking-tight text-neutral-950 leading-[1.08]">
              The custom AI scheduling agent builder
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/tenant/dashboard"
                  className="rounded-full bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  Go to Workspace Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="rounded-full bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition shadow-sm cursor-pointer inline-flex items-center justify-center"
                >
                  Build your agent free
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 lg:pt-2">
            <p className="text-neutral-500 text-base sm:text-[17px] leading-relaxed">
              Build, customize, and deploy autonomous scheduling agents for any appointment
              business. From consulting studios and salons to repair centers and healthcare,
              Schedulux configures your services, staff, rooms, and buffer rules—deploying an AI
              booking concierge that verifies clients via SMS OTP and eliminates double-bookings.
            </p>
          </div>
        </section>

        {/* Central Visual Showcase Card (Split-Pane Agent Builder Studio Preview) */}
        <section className="relative rounded-[32px] border border-neutral-200/90 bg-gradient-to-b from-[#fafaf9] via-[#f7f7f6] to-[#f4f4f2] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden space-y-6">
          {/* Top Switcher Pill Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-white border border-neutral-200/80 shadow-xs self-start">
              <button
                type="button"
                onClick={() => setActiveVertical('consulting')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeVertical === 'consulting'
                    ? 'bg-neutral-100/90 text-neutral-950 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                Consulting &amp; Studios
              </button>
              <button
                type="button"
                onClick={() => setActiveVertical('salons')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeVertical === 'salons'
                    ? 'bg-neutral-100/90 text-neutral-950 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Salons &amp; Wellness
              </button>
              <button
                type="button"
                onClick={() => setActiveVertical('auto')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeVertical === 'auto'
                    ? 'bg-neutral-100/90 text-neutral-950 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Auto &amp; Repair Bays
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-500 bg-white px-3 py-1 rounded-full border border-neutral-200/80 self-start sm:self-auto">
              Agent Builder Studio • Live Preview
            </span>
          </div>

          {/* Split-Pane Builder Preview: AI Architect Chat (Left) + Compiled Canvas (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: AI Architect Conversation */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-neutral-200/90 p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-neutral-950">AI Setup Assistant</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-400">
                  Live Change Preview
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-2xl bg-neutral-950 text-white p-3.5 ml-6 leading-relaxed">
                  &ldquo;{currentVertical.builderPrompt}&rdquo;
                </div>
                <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 text-neutral-700 p-3.5 mr-4 leading-relaxed">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                    Schedulux Builder
                  </span>
                  {currentVertical.builderReply}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Instant sandbox preview</span>
                <span>20-step undo history</span>
              </div>
            </div>

            {/* Right: Live Compiled Canvas + Customer Concierge Result */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-neutral-200/90 p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <span className="text-xs font-bold text-neutral-950">
                  Your Live Booking Rules — {currentVertical.category}
                </span>
                <span className="text-[11px] font-medium bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full">
                  {currentVertical.simulation.intentBadge}
                </span>
              </div>

              {/* Structured Canvas Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Service</span>
                  <div className="font-semibold text-neutral-900">
                    {currentVertical.canvas.serviceName}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {currentVertical.canvas.duration} • {currentVertical.canvas.buffer}
                  </div>
                </div>
                <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    Staff &amp; Rooms
                  </span>
                  <div className="font-semibold text-neutral-900">
                    {currentVertical.canvas.resources}
                  </div>
                  <div className="text-[11px] text-neutral-500">Checked against shifts &amp; holidays</div>
                </div>
                <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    Safety Rules
                  </span>
                  <div className="font-semibold text-neutral-900">
                    {currentVertical.canvas.guardrail}
                  </div>
                  <div className="text-[11px] text-neutral-500">Grounded in your PDFs</div>
                </div>
              </div>

              {/* Embedded Widget Simulation */}
              <div className="rounded-xl bg-neutral-950 text-white p-4 space-y-2 text-xs">
                <div className="text-[11px] text-neutral-400">
                  Customer: &ldquo;{currentVertical.simulation.customerMessage}&rdquo;
                </div>
                <div className="text-neutral-100 leading-relaxed">
                  Concierge: &ldquo;{currentVertical.simulation.agentResponse}&rdquo;
                </div>
                <div className="pt-1 text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{currentVertical.simulation.systemAction}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-200/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-neutral-950 text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-2xs">
                Zero Double-Bookings
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full">
                1-Line Website Embed
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full">
                SMS Phone Verification
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full">
                PDF Policy Answers
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full">
                Emergency Escalation
              </span>
            </div>

            <Link
              to="/product"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors group"
            >
              <span>See how the studio works</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950 transition-all" />
            </Link>
          </div>
        </section>

        {/* Section: CORE CAPABILITIES */}
        <section id="features" className="scroll-mt-28">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              WHY SCHEDULUX
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Built for real bookings, not just chat replies.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Slot Locking */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <Lock className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  Zero Double-Bookings
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Schedulux checks your live hours, staff shifts, and prep buffers—then holds the
                  time slot for 10 minutes while your customer confirms.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                <span>10-MIN SLOT HOLD</span>
                <span className="text-neutral-300">|</span>
                <span>NO OVERLAPS</span>
              </div>
            </div>

            {/* Feature 2: Multi-Resource Coordination */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <Users className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  Staff &amp; Room Pairing
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Reserve both a specialist (doctor, stylist, mechanic) and a physical room, chair,
                  or service bay together in one seamless booking.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                <span>STAFF + ROOMS</span>
                <span className="text-neutral-300">|</span>
                <span>EQUIPMENT &amp; BAYS</span>
              </div>
            </div>

            {/* Feature 3: SMS OTP Verification */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <ShieldCheck className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  SMS Phone Verification
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Stop spam bookings with instant 6-digit SMS verification codes. Verified clients
                  can also reschedule, cancel, or check upcoming visits themselves.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                <span>6-DIGIT SMS CODE</span>
                <span className="text-neutral-300">|</span>
                <span>SELF-SERVICE</span>
              </div>
            </div>

            {/* Feature 4: PDF Knowledge Base */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <FileText className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  Answers from Your PDFs
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Upload pricing menus, prep instructions, or cancellation policies. Your assistant
                  answers customer questions accurately using only your approved documents.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                <span>QDRANT + VOYAGE</span>
                <span className="text-neutral-300">|</span>
                <span>ZERO GUESSES</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: HOW IT WORKS / DEPLOYMENT */}
        <section id="how-it-works" className="scroll-mt-28">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              DEPLOYMENT WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              From business blueprint to live agent in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 block mb-3">
                STEP 01
              </span>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Consult with AI Architect
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Describe your services, staff, and operating hours naturally to the Schedulux Lead
                Booking Architect in your studio, or paste your website URL to auto-extract services
                via our crawler.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 block mb-3">
                STEP 02
              </span>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Configure Guardrails &amp; Buffers
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Set custom preparation and transition buffers between appointments, blackout holiday
                dates, cancellation policy windows, and emergency triage triggers for human staff
                escalation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 block mb-3">
                STEP 03
              </span>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Embed Widget on Your Website
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Customize your chat widget theme, whitelist your website origin, and paste a 1-line
                script tag to start capturing verified 24/7 customer bookings on autopilot.
              </p>
            </div>
          </div>
        </section>

        {/* Section: CUSTOM AGENT BLUEPRINTS */}
        <section id="industries" className="scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
                CUSTOM AGENT BLUEPRINTS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Tailored to any appointment-based business.
              </h2>
            </div>
            <Link
              to="/solutions"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors group self-start sm:self-auto"
            >
              <span>Explore all industry solutions</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950 transition-all" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Blueprint 1: Consulting & Advisory */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Consulting &amp; Advisory
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Discovery calls, senior advisor matching, preparation buffer intervals, and
                automated client intake questionnaires.
              </p>
            </div>

            {/* Blueprint 2: Salons & Wellness */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
                <Scissors className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">Salons &amp; Wellness</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Stylist station assignments, chemical processing buffers, client preferences, and
                6-digit SMS OTP self-service rescheduling.
              </p>
            </div>

            {/* Blueprint 3: Auto & Repair Centers */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                <Car className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Auto &amp; Equipment Bays
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Heavy hoist bay allocation, technician shift coordination, symptom intake, and
                real-time maintenance slot dispatching.
              </p>
            </div>

            {/* Blueprint 4: Healthcare & Clinics */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-5">
                <Building2 className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Healthcare &amp; Clinics
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Patient intake, practitioner and treatment room co-allocation, sanitization buffers,
                and emergency clinical phone handoff.
              </p>
            </div>
          </div>
        </section>

        {/* Section: TRANSPARENT PRICING CTA */}
        <section id="pricing" className="scroll-mt-28">
          <div className="rounded-3xl border border-neutral-200/80 bg-[#fafaf9] p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block">
                TRANSPARENT PRICING
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Start free. Scale when your bookings grow.
              </h2>
              <p className="text-sm text-neutral-500">
                Compare Starter, Pro, Business, and Enterprise plans with live agent, service,
                knowledge base, and token quotas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/pricing"
                className="rounded-full bg-neutral-950 text-white px-6 py-3 text-xs font-semibold hover:bg-neutral-800 transition inline-flex items-center gap-2"
              >
                <span>View Live Plans &amp; Limits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/product"
                className="rounded-full border border-neutral-300 bg-white text-neutral-800 px-6 py-3 text-xs font-semibold hover:bg-neutral-50 transition"
              >
                Explore Product
              </Link>
            </div>
          </div>
        </section>

        {/* Section: FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Everything you need to know about Schedulux.
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/70 transition"
                  >
                    <span className="text-sm font-bold text-neutral-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-neutral-950' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="relative rounded-[32px] border border-neutral-200/90 bg-gradient-to-b from-[#faf6ef]/90 via-[#fcfbf9] to-white p-8 sm:p-14 text-center overflow-hidden shadow-xs">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-200/25 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              Ready to build your custom scheduling agent?
            </h2>
            <p className="text-neutral-500 text-sm sm:text-base mt-3 mb-8">
              Configure your autonomous booking engine in under 5 minutes. No coding required.
            </p>

            {/* URL Input Form */}
            <form onSubmit={handleGenerateAgent} className="relative max-w-lg mx-auto">
              <div className="relative flex items-center">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full pl-5 pr-38 py-3.5 rounded-full border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full bg-neutral-950 text-white px-5 text-xs font-semibold hover:bg-neutral-800 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Build Agent</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <p className="text-xs text-neutral-400 mt-5">
              Instant web widget &bull; Twilio SMS OTP &bull; Zero double-booking
            </p>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
