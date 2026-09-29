import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  MessageSquare,
  Lock,
  UserCheck,
  Building2,
  Car,
  Hotel,
  Scissors,
  ArrowRight,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  PhoneCall,
  Loader2,
} from 'lucide-react';


interface VerticalData {
  name: string;
  dotColor: string;
  nodes: {
    leftNode: string;
    diagnosticTitle: string;
    diagnosticDesc: string;
    centerTitle: string;
    centerDesc: string;
    syncTitle: string;
    syncDesc: string;
    rightNode: string;
  };
  sampleCall: {
    caller: string;
    agent: string;
    status: string;
    action: string;
  };
}

const VERTICALS: Record<string, VerticalData> = {
  clinics: {
    name: 'Clinics & Dental',
    dotColor: 'bg-amber-500',
    nodes: {
      leftNode: 'Consultation',
      diagnosticTitle: 'Intake & Diagnostic',
      diagnosticDesc: 'Adaptive forms and real-time medical history collection.',
      centerTitle: 'Emergency & Triage',
      centerDesc: 'Experience voice agents that triage symptoms and prioritize urgent slots.',
      syncTitle: 'Follow-up & Sync',
      syncDesc: 'Automated re-booking, post-op checks, and SMS OTP verification.',
      rightNode: 'Multi-Seat',
    },
    sampleCall: {
      caller: "Hi, I have severe molar pain that started 2 hours ago. Can I see Dr. Davis today?",
      agent: "I understand that's very painful. Since this is acute dental pain, I'm unlocking an emergency 30-minute priority buffer at 3:15 PM today with Dr. Davis. Shall I reserve this?",
      status: "Triage Alert: Acute Pain Level 8",
      action: "Emergency Buffer Allocated (+15m sanitization)",
    },
  },
  auto: {
    name: 'Auto Centers',
    dotColor: 'bg-emerald-500',
    nodes: {
      leftNode: 'Diagnostics',
      diagnosticTitle: 'Vehicle & Symptom Triage',
      diagnosticDesc: 'VIN lookup, mileage verification, and service bundle estimation.',
      centerTitle: 'Bay & Lift Dispatch',
      centerDesc: 'Assign heavy hoist bays and certified mechanics with real-time parts sync.',
      syncTitle: 'Pickup & Approval',
      syncDesc: 'SMS photo estimations, digital authorizations, and valet coordination.',
      rightNode: 'Fleet Routing',
    },
    sampleCall: {
      caller: "My BMW 3-series needs brake pad replacement and 40k mile service before Friday.",
      agent: "Got it! I found your 2022 BMW 330i in our system. Brake pad replacement requires Lift Bay 3. I have a 9:00 AM slot this Thursday with Senior Tech Marco. Would that work?",
      status: "Bay 3 Hoist Reserved",
      action: "Parts Auto-Reserved in Inventory",
    },
  },
  salons: {
    name: 'Stays & Salons',
    dotColor: 'bg-indigo-400',
    nodes: {
      leftNode: 'Consultation',
      diagnosticTitle: 'Stylist & Service Match',
      diagnosticDesc: 'Hair texture analysis, color processing buffers, and VIP history.',
      centerTitle: 'Chair & Master Booking',
      centerDesc: 'Balance coloring wait-times with precision parallel haircuts.',
      syncTitle: 'Deposit & Re-book',
      syncDesc: 'Card pre-auth, allergy waivers, and 6-week auto maintenance reminders.',
      rightNode: 'Private Rooms',
    },
    sampleCall: {
      caller: "I'd like a balayage and blowout with Elena sometime next Saturday afternoon.",
      agent: "Elena has a balayage opening at 2:00 PM next Saturday. We factor in 90 minutes for processing plus a 45-minute finish blowout. I can lock in chair 4 for you now!",
      status: "Color Buffer Applied (135 min)",
      action: "Deposit Link Dispatched via SMS",
    },
  },
};

export default function LandingPage() {
  const [activeVertical, setActiveVertical] = useState<'clinics' | 'auto' | 'salons'>('clinics');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
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

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-950">
              Schedulux AI
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#products" className="hover:text-neutral-950 transition-colors">Products</a>
            <a href="#solutions" className="hover:text-neutral-950 transition-colors">Solutions</a>
            <a href="#verticals" className="hover:text-neutral-950 transition-colors">Verticals</a>
            <a href="#resources" className="hover:text-neutral-950 transition-colors">Resources</a>
            <a href="#enterprise" className="hover:text-neutral-950 transition-colors">Enterprise</a>
            <a href="#pricing" className="hover:text-neutral-950 transition-colors">Pricing</a>
          </nav>

          {/* Nav Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer"
            >
              Contact sales
            </button>
            <Link
              to="/login"
              className="rounded-full bg-neutral-950 text-white text-sm font-medium px-5 py-2 hover:bg-neutral-800 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-24">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-bold tracking-tight text-neutral-950 leading-[1.08]">
              Bringing autonomous scheduling to life
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="rounded-full bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition shadow-sm cursor-pointer inline-flex items-center justify-center"
              >
                Build your agent free
              </Link>
              <button
                onClick={() => setShowDemoModal(true)}
                className="rounded-full border border-neutral-300 bg-white text-neutral-800 px-6 py-3 text-sm font-medium hover:border-neutral-400 hover:bg-neutral-50 transition cursor-pointer"
              >
                Contact sales
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pt-2">
            <p className="text-neutral-500 text-base sm:text-[17px] leading-relaxed">
              Powering the best clinics, auto centers, and service enterprises. From Schedulux Agents for dynamic patient intake, to deterministic buffer management and voice-to-calendar orchestration.
            </p>
          </div>
        </section>

        {/* Central Visual Showcase Card */}
        <section className="relative rounded-[32px] border border-neutral-200/90 bg-gradient-to-b from-[#fafaf9] via-[#f7f7f6] to-[#f4f4f2] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          {/* Top Switcher Pill Bar */}
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-white border border-neutral-200/80 shadow-xs">
              <button
                onClick={() => setActiveVertical('clinics')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeVertical === 'clinics'
                    ? 'bg-neutral-100/90 text-neutral-950 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                Clinics & Dental
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
                Auto Centers
              </button>
              <button
                onClick={() => setActiveVertical('salons')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeVertical === 'salons'
                    ? 'bg-neutral-100/90 text-neutral-950 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                Stays & Salons
              </button>
            </div>
          </div>

          {/* Voice Agent Visualizer Row */}
          <div className="py-12 sm:py-16 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            {/* 1. Left Node: Soft Cyan Frosted Sphere */}
            <div className="flex flex-col items-center flex-shrink-0 w-28 text-center opacity-85 hover:opacity-100 transition">
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#99f6e4]/40 via-[#ccfbf1]/50 to-[#e0f2fe]/60 border border-teal-200/50 shadow-inner flex items-center justify-center backdrop-blur-xs">
                <div className="w-10 h-10 rounded-full bg-white/40 blur-xs" />
              </div>
              <span className="text-xs text-neutral-400 font-medium mt-3">
                {currentVertical.nodes.leftNode}
              </span>
            </div>

            {/* 2. Intake & Diagnostic: Radiant Pink/Magenta Disc */}
            <div className="flex flex-col items-center flex-shrink-0 w-44 sm:w-48 text-center">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-gradient-to-br from-[#f472b6] via-[#ec4899] to-[#d946ef] p-0.5 shadow-xl shadow-pink-500/20 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-gradient-to-tr from-[#db2777] to-[#f472b6] flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xs">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Ping wave */}
                <div className="absolute inset-0 rounded-full border-2 border-pink-400/40 animate-ping pointer-events-none opacity-20" />
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm mt-4">
                {currentVertical.nodes.diagnosticTitle}
              </h4>
              <p className="text-xs text-neutral-500 max-w-[170px] mt-1 leading-snug">
                {currentVertical.nodes.diagnosticDesc}
              </p>
            </div>

            {/* 3. Center Featured Node: Grey Frosted Box with Play Button */}
            <div className="flex flex-col items-center flex-shrink-0 w-60 sm:w-72">
              <div className="w-full bg-[#dedede]/65 border border-neutral-300/80 rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center shadow-sm relative group hover:bg-[#dedede]/85 transition">
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  aria-label="Play sample voice agent interaction"
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white text-neutral-900 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-5 h-5 text-neutral-900 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 text-neutral-900 fill-current translate-x-0.5" />
                  )}
                </button>

                {isPlayingAudio && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 animate-pulse">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Live Voice Agent Active</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-neutral-900">
                  <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 cursor-pointer hover:text-neutral-900" />
                  <span>{currentVertical.nodes.centerTitle}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 cursor-pointer hover:text-neutral-900" />
                </div>

                <p className="text-xs text-neutral-600 text-center max-w-[210px] mt-1.5 leading-snug">
                  {currentVertical.nodes.centerDesc}
                </p>
              </div>
            </div>

            {/* 4. Follow-up & Sync: Dark Charcoal Bronze Disc */}
            <div className="flex flex-col items-center flex-shrink-0 w-44 sm:w-48 text-center">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-[#27211e] p-1 border border-neutral-700/60 shadow-xl shadow-neutral-900/15 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                  {/* Concentric rings */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-neutral-700/50 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-neutral-600/50 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-xs" />
                    </div>
                  </div>
                </div>
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm mt-4">
                {currentVertical.nodes.syncTitle}
              </h4>
              <p className="text-xs text-neutral-500 max-w-[170px] mt-1 leading-snug">
                {currentVertical.nodes.syncDesc}
              </p>
            </div>

            {/* 5. Right Node: Soft Cyan Frosted Sphere */}
            <div className="flex flex-col items-center flex-shrink-0 w-28 text-center opacity-85 hover:opacity-100 transition">
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#99f6e4]/40 via-[#ccfbf1]/50 to-[#e0f2fe]/60 border border-teal-200/50 shadow-inner flex items-center justify-center backdrop-blur-xs">
                <div className="w-10 h-10 rounded-full bg-white/40 blur-xs" />
              </div>
              <span className="text-xs text-neutral-400 font-medium mt-3">
                {currentVertical.nodes.rightNode}
              </span>
            </div>
          </div>

          {/* Interactive Voice Audio Drawer (When Play is Active) */}
          {isPlayingAudio && (
            <div className="mb-6 p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">
                      Simulated Caller: {currentVertical.name} Inbound Line
                    </div>
                    <div className="text-[11px] text-emerald-600 font-mono">
                      Latency: 180ms • Deterministic Slot Lock active
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                    {currentVertical.sampleCall.status}
                  </span>
                  <button
                    onClick={() => setIsPlayingAudio(false)}
                    className="text-neutral-400 hover:text-neutral-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Caller Voice Stream:
                  </span>
                  <p className="text-neutral-700 italic">
                    "{currentVertical.sampleCall.caller}"
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 text-white border border-neutral-800">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Schedulux AI Agent Response:
                  </span>
                  <p className="text-neutral-100">
                    "{currentVertical.sampleCall.agent}"
                  </p>
                  <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    {currentVertical.sampleCall.action}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-neutral-950 text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-2xs">
                AI Voice Engine
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Google Cal Sync
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Outlook 365
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                SMS OTP Memory
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Triage Guardrails
              </span>
              <span className="bg-white/90 border border-neutral-200/80 text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-300 transition cursor-default">
                Multi-Bay Routing
              </span>
            </div>

            <a
              href="#docs"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors group cursor-pointer"
            >
              <span>Explore Documentation</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950 transition-all" />
            </a>
          </div>
        </section>

        {/* Section: ENGINE ARCHITECTURE */}
        <section id="products">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              ENGINE ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Engineered for deterministic precision, not guesses.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Architecture Card 1 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 sm:p-8 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <Lock className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-lg font-bold text-neutral-950 mb-2.5">
                  Deterministic Slot Locking
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Eliminate double-booking forever. Schedulux locks real-time calendar availability during phone calls and web chats, instantly factoring doctor switch times, cleaning intervals, and equipment constraints.
                </p>
              </div>

              <div className="pt-6 mt-8 border-t border-neutral-150 flex items-center gap-3 text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                <span>LATENCY: &lt; 240MS</span>
                <span className="text-neutral-300">|</span>
                <span>CONFLICT RESOLUTION: 100% RELIABLE</span>
              </div>
            </div>

            {/* Architecture Card 2 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-7 sm:p-8 flex flex-col justify-between hover:border-neutral-300 hover:bg-white transition-all duration-200 group">
              <div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 mb-6 shadow-2xs group-hover:border-neutral-300 transition">
                  <UserCheck className="w-4 h-4 text-neutral-800" />
                </div>
                <h3 className="text-lg font-bold text-neutral-950 mb-2.5">
                  Multi-session Client Memory
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Recognize returning callers instantly with secure SMS OTP. The agent recalls previous practitioner preferences, vehicle engine models, or salon styling history to personalize each booking conversation.
                </p>
              </div>

              <div className="pt-6 mt-8 border-t border-neutral-150 flex items-center gap-3 text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                <span>ENCRYPTION: AES-256</span>
                <span className="text-neutral-300">|</span>
                <span>COMPLIANCE: HIPAA &amp; SOC-2 READY</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: DEPLOYMENT */}
        <section id="solutions">
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
              DEPLOYMENT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              From schedule roster to live agent in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 block mb-3">
                STEP 01
              </span>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Drop your Schedule
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Upload CSV rosters, connect your Google/Outlook accounts, or paste service pricing. Schedulux parses service lengths, technician specialties, and breaks automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 block mb-3">
                STEP 02
              </span>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Triage Guardrails
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Configure boundaries. Flag acute symptoms for instant human operator transfer, enforce required deposits, and mandate custom customer intake disclosures.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 block mb-3">
                STEP 03
              </span>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Embed Anywhere
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Route incoming inbound VoIP phone lines or copy a single-line script tag into your web footer. Your agent handles omni-channel bookings around the clock.
              </p>
            </div>
          </div>
        </section>

        {/* Section: SPECIALIZED VERTICALS */}
        <section id="verticals">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2">
                SPECIALIZED VERTICALS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Tailored to high-touch appointment businesses.
              </h2>
            </div>
            <a
              href="#case-studies"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors group cursor-pointer self-start sm:self-auto"
            >
              <span>View enterprise case studies</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-950 transition-all" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Vertical 1: Clinics & Dental */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-5">
                <Building2 className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Clinics &amp; Dental
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Patient intake, doctor &amp; treatment buffer calculation, and emergency clinical triage without front-desk delays.
              </p>
            </div>

            {/* Vertical 2: Auto Service Bays */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                <Car className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Auto Service Bays
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Bay allocation, lift availability, P&amp;D troupe collection, and automated mechanic shift balancing.
              </p>
            </div>

            {/* Vertical 3: Boutique Stays */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
                <Hotel className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Boutique Stays
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Room reservations, activity dining add-ons, housekeeping turnover coordination, and guest preferences.
              </p>
            </div>

            {/* Vertical 4: Salons & Spas */}
            <div className="rounded-2xl border border-neutral-200/80 bg-[#fafafa] p-6 hover:bg-white hover:border-neutral-300 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
                <Scissors className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 mb-2">
                Salons &amp; Spas
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Chair assignments, hair processing duration buffers, recurring client sourcings, and stylist matching.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="relative rounded-[32px] border border-neutral-200/90 bg-gradient-to-b from-[#faf6ef]/90 via-[#fcfbf9] to-white p-8 sm:p-14 text-center overflow-hidden shadow-xs">
          {/* Subtle warm glow orb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-200/25 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              Ready to deploy your 24/7 service agent?
            </h2>
            <p className="text-neutral-500 text-sm sm:text-base mt-3 mb-8">
              Set up your autonomous booking engine in under 5 minutes. No coding required.
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
                  <span>Agent scaffold generated successfully for <strong>{websiteUrl}</strong>! Connecting calendar sync.</span>
                </div>
              )}
            </form>

            <p className="text-xs text-neutral-400 mt-5">
              Free 14-day trial &bull; 100 included minutes &bull; Instant calendar sync
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
            <span className="font-bold text-sm tracking-tight text-neutral-950">
              Schedulux AI
            </span>
            <span className="text-neutral-400 text-xs ml-2">
              &copy; 2026 Schedulux Inc. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500 font-medium">
            <a href="#privacy" className="hover:text-neutral-950 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-neutral-950 transition-colors">Terms of Service</a>
            <a href="#security" className="hover:text-neutral-950 transition-colors">Security &amp; HIPAA</a>
            <a href="#status" className="hover:text-neutral-950 transition-colors">Status</a>
          </div>
        </div>
      </footer>

      {/* Interactive Contact / Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-neutral-950">
                Experience Schedulux AI
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-6">
              Connect with our solutions team to test your phone lines or custom calendar buffer models.
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
                  placeholder="alex@clinicgroup.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Primary Appointment Type
                </label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 text-neutral-700">
                  <option>Medical &amp; Dental Clinic</option>
                  <option>Automotive Bay &amp; Repair</option>
                  <option>High-end Salon &amp; Spa</option>
                  <option>Boutique Hospitality &amp; Dining</option>
                  <option>Other Service Business</option>
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
