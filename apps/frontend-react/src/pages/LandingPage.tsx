import {
  ArrowRight,
  Briefcase,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Lock,
  Menu,
  MessageSquare,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';

interface VerticalData {
  name: string;
  dotColor: string;
  category: string;
  nodes: {
    leftNode: string;
    diagnosticTitle: string;
    diagnosticDesc: string;
    centerTitle: string;
    centerDesc: string;
    confirmTitle: string;
    confirmDesc: string;
    rightNode: string;
  };
  simulation: {
    customerMessage: string;
    intentBadge: string;
    agentResponse: string;
    systemAction: string;
    resourceAllocation: string;
  };
}

const VERTICALS: Record<string, VerticalData> = {
  consulting: {
    name: 'Consulting & Studios',
    dotColor: 'bg-indigo-500',
    category: 'Professional Services & Advisory',
    nodes: {
      leftNode: 'Intake Brief',
      diagnosticTitle: 'Consultant Matching',
      diagnosticDesc: 'Analyze project scope, client requirements, and advisor availability.',
      centerTitle: 'Deterministic Booking',
      centerDesc: 'Hold candidate slots in RAM with preparation and wrap-up buffers.',
      confirmTitle: 'SMS Verification',
      confirmDesc: '6-digit SMS OTP verification, self-service rescheduling, and instant alerts.',
      rightNode: 'Meeting Suite 2',
    },
    simulation: {
      customerMessage:
        'Hi, I need a 60-minute strategy audit session with Sarah next Tuesday morning.',
      intentBadge: 'Intent: Booking • Service: Strategy Audit (60m)',
      agentResponse:
        'Sarah has an opening on Tuesday, November 17 at 10:00 AM in Executive Suite 2. We factor in 15 minutes of preparation buffer before your session. May I send a 6-digit SMS verification code to confirm this reservation?',
      systemAction: 'RAM Slot Hold: 15-minute lock • Specialist Sarah + Suite 2 Co-allocated',
      resourceAllocation: 'Lead: Sarah M. • Facility: Executive Suite 2',
    },
  },
  salons: {
    name: 'Salons & Wellness',
    dotColor: 'bg-rose-500',
    category: 'Salons, Spas & Personal Care',
    nodes: {
      leftNode: 'Consultation',
      diagnosticTitle: 'Stylist & Station Match',
      diagnosticDesc: 'Custom processing buffers, stylist skillsets, and VIP client preferences.',
      centerTitle: 'Deterministic Booking',
      centerDesc: 'Hold slots in RAM while balancing treatment time and station turnaround.',
      confirmTitle: 'SMS Verification',
      confirmDesc: 'SMS OTP verification, self-service cancellation, and instant reminders.',
      rightNode: 'Station Chair 4',
    },
    simulation: {
      customerMessage: 'I would like a balayage and blowout with Elena sometime next Saturday.',
      intentBadge: 'Intent: Booking • Service: Balayage & Blowout (135m)',
      agentResponse:
        'Elena has an opening on Saturday, November 21 at 2:00 PM. We allocate 90 minutes for color processing plus a 45-minute finish blowout at Station Chair 4. I can hold this slot and send an SMS verification code now!',
      systemAction: 'Hold Duration: 15m active • Elena + Station 4 co-scheduled',
      resourceAllocation: 'Stylist: Elena R. • Resource: Station Chair 4',
    },
  },
  auto: {
    name: 'Auto & Repair Bays',
    dotColor: 'bg-emerald-500',
    category: 'Auto Repair & Service Bays',
    nodes: {
      leftNode: 'Diagnostics',
      diagnosticTitle: 'Bay & Tech Dispatch',
      diagnosticDesc: 'Co-allocate certified technicians and physical heavy hoist bays.',
      centerTitle: 'Deterministic Booking',
      centerDesc: 'Real-time slot locking factoring mechanic shift hours and bay turnover.',
      confirmTitle: 'SMS Verification',
      confirmDesc: 'SMS OTP verification, self-service appointment lookups, and job readiness.',
      rightNode: 'Lift Bay 3',
    },
    simulation: {
      customerMessage: 'My sedan needs brake pad replacement and 40k inspection before Friday.',
      intentBadge: 'Intent: Booking • Service: Brake Pad Service (90m)',
      agentResponse:
        'Brake pad replacement requires a heavy hoist bay. Senior Technician Marco is available Thursday, November 19 at 9:00 AM with Lift Bay 3. Would you like me to reserve this appointment for your vehicle?',
      systemAction: 'Multi-Resource Reservation: Tech Marco + Lift Bay 3 Locked',
      resourceAllocation: 'Mechanic: Marco V. • Asset: Hoist Bay 3',
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
  const { user, isAuthenticated } = useAuthStore();
  const [activeVertical, setActiveVertical] = useState<'consulting' | 'salons' | 'auto'>(
    'consulting',
  );
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const currentVertical = VERTICALS[activeVertical];

  const handleGenerateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedSuccess(true);
    }, 1800);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-950">Schedulux AI</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-neutral-950 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-neutral-950 transition-colors">
              How It Works
            </a>
            <a href="#industries" className="hover:text-neutral-950 transition-colors">
              Industries
            </a>
            <a href="#pricing" className="hover:text-neutral-950 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-neutral-950 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Nav Actions */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/tenant/dashboard"
                className="rounded-full bg-neutral-950 text-white text-sm font-medium px-5 py-2 hover:bg-neutral-800 transition shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {user?.business_name || 'Dashboard'}
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors px-2 py-1"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-neutral-950 text-white text-sm font-medium px-5 py-2 hover:bg-neutral-800 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-100 bg-white px-6 py-5 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
            >
              How It Works
            </a>
            <a
              href="#industries"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
            >
              Industries
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <Link
                  to="/tenant/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full bg-neutral-950 text-white text-sm font-medium py-2.5"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-medium text-neutral-700"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-full bg-neutral-950 text-white text-sm font-medium py-2.5"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

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

        {/* Central Visual Showcase Card (Interactive Concierge Simulator) */}
        <section className="relative rounded-[32px] border border-neutral-200/90 bg-gradient-to-b from-[#fafaf9] via-[#f7f7f6] to-[#f4f4f2] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          {/* Top Switcher Pill Bar */}
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-white border border-neutral-200/80 shadow-xs">
              <button
                onClick={() => setActiveVertical('consulting')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeVertical === 'consulting'
                    ? 'bg-neutral-100/90 text-neutral-950 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse" />
                Consulting &amp; Studios
              </button>
              <button
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
          </div>

          {/* Visual Architecture Node Flow */}
          <div className="py-10 sm:py-14 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            {/* 1. Left Node: Intake */}
            <div className="flex flex-col items-center flex-shrink-0 w-28 text-center opacity-85 hover:opacity-100 transition">
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#99f6e4]/40 via-[#ccfbf1]/50 to-[#e0f2fe]/60 border border-teal-200/50 shadow-inner flex items-center justify-center backdrop-blur-xs">
                <div className="w-10 h-10 rounded-full bg-white/40 blur-xs" />
              </div>
              <span className="text-xs text-neutral-400 font-medium mt-3">
                {currentVertical.nodes.leftNode}
              </span>
            </div>

            {/* 2. Intake & Diagnostic Disc */}
            <div className="flex flex-col items-center flex-shrink-0 w-44 sm:w-48 text-center">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-gradient-to-br from-[#f472b6] via-[#ec4899] to-[#d946ef] p-0.5 shadow-xl shadow-pink-500/20 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-gradient-to-tr from-[#db2777] to-[#f472b6] flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xs">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-pink-400/40 animate-ping pointer-events-none opacity-20" />
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm mt-4">
                {currentVertical.nodes.diagnosticTitle}
              </h4>
              <p className="text-xs text-neutral-500 max-w-[170px] mt-1 leading-snug">
                {currentVertical.nodes.diagnosticDesc}
              </p>
            </div>

            {/* 3. Center Featured Node: Core Booking Engine */}
            <div className="flex flex-col items-center flex-shrink-0 w-60 sm:w-72">
              <div className="w-full bg-[#dedede]/65 border border-neutral-300/80 rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center shadow-sm relative group hover:bg-[#dedede]/85 transition">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-neutral-950 text-white shadow-md flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>

                <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Deterministic RAM Lock Active</span>
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-neutral-900">
                  <ChevronLeft className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{currentVertical.nodes.centerTitle}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </div>

                <p className="text-xs text-neutral-600 text-center max-w-[210px] mt-1.5 leading-snug">
                  {currentVertical.nodes.centerDesc}
                </p>
              </div>
            </div>

            {/* 4. Follow-up & Verification: Dark Charcoal Disc */}
            <div className="flex flex-col items-center flex-shrink-0 w-44 sm:w-48 text-center">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-[#27211e] p-1 border border-neutral-700/60 shadow-xl shadow-neutral-900/15 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-neutral-700/50 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-neutral-600/50 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-xs" />
                    </div>
                  </div>
                </div>
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm mt-4">
                {currentVertical.nodes.confirmTitle}
              </h4>
              <p className="text-xs text-neutral-500 max-w-[170px] mt-1 leading-snug">
                {currentVertical.nodes.confirmDesc}
              </p>
            </div>

            {/* 5. Right Node: Facility Asset */}
            <div className="flex flex-col items-center flex-shrink-0 w-28 text-center opacity-85 hover:opacity-100 transition">
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#99f6e4]/40 via-[#ccfbf1]/50 to-[#e0f2fe]/60 border border-teal-200/50 shadow-inner flex items-center justify-center backdrop-blur-xs">
                <div className="w-10 h-10 rounded-full bg-white/40 blur-xs" />
              </div>
              <span className="text-xs text-neutral-400 font-medium mt-3">
                {currentVertical.nodes.rightNode}
              </span>
            </div>
          </div>

          {/* Live Conversational Simulation Box */}
          <div className="mb-6 p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-sm animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900">
                    Live Booking Concierge: {currentVertical.category}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-mono">
                    {currentVertical.simulation.resourceAllocation}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full">
                  {currentVertical.simulation.intentBadge}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                  Customer Input (Web Chat Widget):
                </span>
                <p className="text-neutral-700 italic">
                  "{currentVertical.simulation.customerMessage}"
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-950 text-white border border-neutral-800">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                  Schedulux Concierge Response:
                </span>
                <p className="text-neutral-100 leading-relaxed">
                  "{currentVertical.simulation.agentResponse}"
                </p>
                <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{currentVertical.simulation.systemAction}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-neutral-950 text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-2xs">
                Deterministic Slot Lock
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Embeddable Web Widget
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                SMS OTP Verification
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Qdrant Vector RAG
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Staff &amp; Facility Co-Allocation
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Emergency Triage Guardrails
              </span>
            </div>

            <a
              href="#how-it-works"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors group cursor-pointer"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950 transition-all" />
            </a>
          </div>
        </section>

        {/* Section: ENGINE ARCHITECTURE & FEATURES */}
        <section id="features" className="scroll-mt-28">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              ENGINE ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Engineered for deterministic precision, not guesses.
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
                  Deterministic Slot Locking
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Eliminate double-booking forever. Schedulux evaluates operating hours, shift
                  calendars, and buffer intervals, holding a temporary lock in RAM until the
                  appointment is confirmed.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                <span>LATENCY: &lt; 240MS</span>
                <span className="text-neutral-300">|</span>
                <span>ZERO OVERLAPS</span>
              </div>
            </div>

            {/* Feature 2: Multi-Resource Coordination */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <Users className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  Staff &amp; Facility Co-Allocation
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Co-allocate human specialists (advisors, stylists, technicians) and physical
                  assets (meeting suites, styling stations, service bays) in a single unified
                  booking.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                <span>STAFF + ROOMS</span>
                <span className="text-neutral-300">|</span>
                <span>ASSET DISPATCH</span>
              </div>
            </div>

            {/* Feature 3: SMS OTP Verification */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <ShieldCheck className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  SMS OTP Customer Verification
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Protect appointments with 6-digit SMS OTP verification powered by Twilio.
                  Customers can securely self-serve to reschedule, cancel, or look up past bookings.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-150 flex items-center gap-2 text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                <span>TWILIO SMS OTP</span>
                <span className="text-neutral-300">|</span>
                <span>FRAUD DEFENSE</span>
              </div>
            </div>

            {/* Feature 4: PDF Knowledge Base RAG */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group shadow-2xs">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <FileText className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-2">
                  PDF Knowledge Base RAG
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Upload service guidelines, pricing sheets, or cancellation policies. Qdrant vector
                  search and Voyage AI embeddings answer customer questions with strict
                  zero-hallucination grounding.
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
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors group cursor-pointer self-start sm:self-auto"
            >
              <span>Schedule custom blueprint walkthrough</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950 transition-all" />
            </button>
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

        {/* Section: TRANSPARENT PRICING (MATCHING TIER CONFIGS) */}
        <section id="pricing" className="scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Simple, predictable plans for growing businesses.
            </h2>
            <p className="text-sm text-neutral-500 mt-2">
              Every plan includes autonomous AI booking concierges, deterministic slot locking, and
              zero double-booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Plan 1: Starter */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 flex flex-col justify-between shadow-xs hover:border-neutral-300 transition">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Starter
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                    $0
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">/ forever</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Baseline tier for solo operators and independent specialists building their first
                  AI scheduling agent.
                </p>

                <div className="space-y-3 pt-6 border-t border-neutral-100 text-xs text-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>1</strong> AI Booking Agent
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Up to <strong>2</strong> Bookable Services
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Up to <strong>2</strong> Staff / Bay Resources
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3 Knowledge Base PDFs (5MB max)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100,000 Weekly AI Tokens</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6">
                <Link
                  to="/register"
                  className="w-full rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-900 font-semibold py-2.5 text-xs transition flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* Plan 2: Pro */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 flex flex-col justify-between shadow-xs hover:border-neutral-300 transition">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Pro
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                    $29
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">/ month</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  For growing businesses with multiple bookable services and custom team resources.
                </p>

                <div className="space-y-3 pt-6 border-t border-neutral-100 text-xs text-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>2</strong> AI Booking Agents
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Up to <strong>15</strong> Bookable Services
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Up to <strong>10</strong> Staff / Bay Resources
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10 Knowledge Base PDFs (25MB max)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>500,000 Weekly AI Tokens</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6">
                <Link
                  to="/register"
                  className="w-full rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-900 font-semibold py-2.5 text-xs transition flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  Start Pro Trial
                </Link>
              </div>
            </div>

            {/* Plan 3: Business (Most Popular) */}
            <div className="rounded-3xl border-2 border-neutral-950 bg-[#fafafa] p-7 flex flex-col justify-between shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-950 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
                  Business
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                    $79
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">/ month</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  High-capacity tier for busy multi-staff businesses, studios, and high-volume
                  operations.
                </p>

                <div className="space-y-3 pt-6 border-t border-neutral-200 text-xs text-neutral-800 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>5</strong> AI Booking Agents
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Up to <strong>50</strong> Bookable Services
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Up to <strong>50</strong> Staff / Bay Resources
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>50 Knowledge Base PDFs (100MB max)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>2,500,000 Weekly AI Tokens</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6">
                <Link
                  to="/register"
                  className="w-full rounded-full bg-neutral-950 text-white font-semibold py-2.5 text-xs hover:bg-neutral-800 transition flex items-center justify-center cursor-pointer shadow-xs"
                >
                  Get Business
                </Link>
              </div>
            </div>

            {/* Plan 4: Enterprise */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 flex flex-col justify-between shadow-xs hover:border-neutral-300 transition">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Enterprise
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                    $199
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">/ month</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Unlimited enterprise capability with bespoke rate limits and dedicated SLA.
                </p>

                <div className="space-y-3 pt-6 border-t border-neutral-100 text-xs text-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Unlimited</strong> AI Agents
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Unlimited</strong> Services &amp; Resources
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Knowledge Base Documents</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Weekly AI Tokens</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1,000 RPM API Limit &amp; 99.9% SLA</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6">
                <Link
                  to="/register"
                  className="w-full rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-900 font-semibold py-2.5 text-xs transition flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  Get Enterprise
                </Link>
              </div>
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
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="Enter your business website URL"
                  className="w-full pl-5 pr-38 py-3.5 rounded-full border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full bg-neutral-950 text-white px-5 text-xs font-semibold hover:bg-neutral-800 disabled:opacity-75 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Generate Agent'
                  )}
                </button>
              </div>

              {generatedSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Agent scaffold generated successfully for <strong>{websiteUrl}</strong>! Ready
                    to customize in your studio.
                  </span>
                </div>
              )}
            </form>

            <p className="text-xs text-neutral-400 mt-5">
              Instant web widget &bull; Twilio SMS OTP &bull; Zero double-booking
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-neutral-950 rounded-full inline-block" />
              <span className="w-1.5 h-4 bg-neutral-950 rounded-full inline-block" />
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-950">Schedulux AI</span>
            <span className="text-neutral-400 text-xs ml-2">
              &copy; 2026 Schedulux Inc. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500 font-medium">
            <a href="#features" className="hover:text-neutral-950 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-neutral-950 transition-colors">
              Workflow
            </a>
            <a href="#pricing" className="hover:text-neutral-950 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-neutral-950 transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </footer>

      {/* Interactive Contact / Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-800 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-neutral-950">Experience Schedulux AI</h3>
            </div>
            <p className="text-xs text-neutral-500 mb-6">
              Connect with our solutions team to test custom scheduling rules or multi-resource
              allocation.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you! A Schedulux engineer will connect with you within 15 minutes.');
                setShowDemoModal(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@yourbusiness.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Primary Appointment Type
                </label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 text-neutral-700">
                  <option>Professional &amp; Consulting Services</option>
                  <option>Salons, Spas &amp; Personal Care</option>
                  <option>Automotive &amp; Equipment Services</option>
                  <option>Healthcare &amp; Wellness Clinics</option>
                  <option>Other Custom Appointment Business</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Monthly Booking Volume
                </label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 text-neutral-700">
                  <option>100 – 500 appointments / mo</option>
                  <option>500 – 2,500 appointments / mo</option>
                  <option>2,500+ enterprise appointments</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-full bg-neutral-950 text-white font-medium py-3 text-xs hover:bg-neutral-800 transition shadow-sm cursor-pointer"
                >
                  Schedule 1-on-1 Sandbox Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
