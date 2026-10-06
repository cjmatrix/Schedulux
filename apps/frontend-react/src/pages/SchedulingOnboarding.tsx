import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";

type ServiceType = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
};

const services: ServiceType[] = [
  {
    id: "medical",
    title: "Medical & Dental Clinics",
    description:
      "Doctor shifts, chair sanitization buffers, insurance triage, and HIPAA-compliant patient intake.",
    badge: "Pre-configured 15m buffers + OTP verify",
    icon: "✚",
  },
  {
    id: "auto",
    title: "Auto Repair & Services",
    description:
      "Physical bay & lift allocations, vehicle VIN collection, parts lead times, and diagnostic scaling.",
    badge: "Equipment & bay constraint modeling",
    icon: "◉",
  },
  {
    id: "hospitality",
    title: "Hospitality & Rooms",
    description:
      "Check-in/out date ranges, 4-hour housekeeping turnover blocks, room categories, and guest add-ons.",
    badge: "Multi-day capacity & turnover blocks",
    icon: "▣",
  },
  {
    id: "custom",
    title: "Others / Custom Service",
    description:
      "Salons, legal practices, consulting, or bespoke service models with custom rulesets and buffers.",
    badge: "Configurable slot math & custom fields",
    icon: "☷",
  },
];

export default function SchedulingOnboarding() {
  const [selected, setSelected] = useState("medical");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const selectedService = services.find(
    (service) => service.id === selected
  );

  const handleContinue = () => {
    console.log("Selected service:", selectedService);
    console.log("Website:", websiteUrl);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 h-16 px-6 sm:px-8 flex items-center justify-between">
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

        {/* Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <div className="flex items-center rounded-full bg-neutral-100/80 p-1 text-sm font-medium">
            <button className="rounded-full bg-white px-5 py-1.5 shadow-sm text-neutral-900 border border-neutral-200/60">
              Agent Studio
            </button>
            <button className="px-5 py-1.5 text-neutral-500 hover:text-neutral-900 transition cursor-pointer">
              Dashboard
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
            Start with a pre-configured template, or build your own custom rules engine from scratch.
          </p>
        </div>

        {/* Website Auto Generate */}
        <section className="rounded-[24px] border border-neutral-200 bg-[#fbfbfb] p-6 sm:p-8 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
             
              Auto-generate from your existing site
            </h2>
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Instant AI ingestion
            </span>
          </div>

          <p className="text-sm leading-relaxed text-neutral-500 mb-6 max-w-2xl">
            Paste your website or booking page URL. Schedulux AI will automatically detect your services, appointment buffers, staff roles, and intake requirements.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 items-center rounded-full border border-neutral-300 bg-white px-5 shadow-xs focus-within:ring-2 focus-within:ring-neutral-950 focus-within:border-transparent transition">
              <span className="mr-3 text-neutral-400 font-bold">URL</span>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-neutral-400 text-neutral-900"
              />
            </div>
            <button
              onClick={() => console.log("Auto-detect:", websiteUrl)}
              className="rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-sm whitespace-nowrap cursor-pointer"
            >
              Auto-Detect Rules
            </button>
          </div>

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
                    ? "border-neutral-950 bg-white shadow-md ring-1 ring-neutral-950"
                    : "border-neutral-200 bg-[#fbfbfb] hover:border-neutral-300 hover:bg-white"
                }`}
              >
                {/* Recommended Badge */}
                {service.id === "medical" && (
                  <span className="absolute right-6 top-6 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Recommended
                  </span>
                )}

                {/* Icon */}
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isSelected ? "bg-neutral-950 text-white" : "bg-white border border-neutral-200 text-neutral-700 shadow-sm"
                  } text-xl`}
                >
                  {service.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-neutral-950 mb-2">
                  {service.title}
                </h3>
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
                  {selectedService?.title} Template
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
            Continue with Template
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              setSelected("custom");
              console.log("Starting from blank canvas");
            }}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer group flex items-center gap-1"
          >
            Or start from a blank canvas <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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