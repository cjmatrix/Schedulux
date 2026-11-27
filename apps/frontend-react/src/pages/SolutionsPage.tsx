import {
  ArrowRight,
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  Scissors,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/PublicLayout';

const INDUSTRIES = [
  {
    icon: Stethoscope,
    name: 'Medical & Dental Clinics',
    badge: 'Recommended Template',
    accent: 'text-rose-600 bg-rose-50',
    bookingStyle: 'Hourly Appointments',
    summary:
      'Book doctors and treatment rooms together with 15-minute sanitization buffers, privacy scrubbing, and instant emergency routing.',
    capabilities: [
      'Privacy-first patient data handling and scrubbing',
      'Instant emergency keyword detection with your clinic phone override',
      '6-digit SMS verification before confirming appointments',
      'Answers insurance & prep questions strictly from clinic PDFs',
    ],
  },
  {
    icon: Scissors,
    name: 'Salons, Spas & Wellness',
    badge: 'Pick Your Stylist',
    accent: 'text-indigo-600 bg-indigo-50',
    bookingStyle: 'Hourly Appointments',
    summary:
      'Let clients choose their favorite stylist or therapist while automatically reserving the matching styling chair or treatment room.',
    capabilities: [
      'Per-service duration plus processing and cleanup buffers',
      'Let clients pick a specific stylist or auto-assign first available',
      'Custom weekly schedules and holiday closures per stylist',
      'Self-service reschedule and cancel protected by SMS verification',
    ],
  },
  {
    icon: Car,
    name: 'Auto Repair & Service Bays',
    badge: 'Tech + Bay Pairing',
    accent: 'text-emerald-700 bg-emerald-50',
    bookingStyle: 'Combined Staff + Bays',
    summary:
      'Reserve a certified technician and a physical lift bay together so neither your mechanics nor your bays are ever double-booked.',
    capabilities: [
      'Locks both technician and service bay at the same time',
      'Matches services only to qualified technicians and bays',
      'Automated SMS confirmations and appointment updates',
      'Enforces lead-time and advance booking windows',
    ],
  },
  {
    icon: Building2,
    name: 'Hospitality, Stays & Rentals',
    badge: 'Multi-Day Stays',
    accent: 'text-amber-700 bg-amber-50',
    bookingStyle: 'Multi-Day Check-In / Out',
    summary:
      'Switch from hourly slots to multi-day check-in and check-out reservations with turnover windows and instant house-rule answers.',
    capabilities: [
      'Multi-day date range availability across rooms or equipment',
      'Turnover buffers and seasonal blackout dates',
      'Instant answers on check-in times, deposits, and amenities',
      'Branded website widget or shareable hosted booking link',
    ],
  },
  {
    icon: Briefcase,
    name: 'Consulting & Advisory Studios',
    badge: 'Fast Website Setup',
    accent: 'text-slate-700 bg-slate-100',
    bookingStyle: 'Hourly Appointments',
    summary:
      'Paste your studio website URL and launch an AI intake and booking assistant in minutes—no manual form setup.',
    capabilities: [
      'Auto-imports services, pricing, and advisor roster from your site',
      'Timezone-aware scheduling with prep and wrap-up buffers',
      'Routes complex or enterprise inquiries straight to your team',
      'Matches your brand colors, fonts, and light/dark theme',
    ],
  },
  {
    icon: Sparkles,
    name: 'Other & Custom Businesses',
    badge: 'Blank Canvas',
    accent: 'text-violet-700 bg-violet-50',
    bookingStyle: 'Hourly or Multi-Day',
    summary:
      'Fitness studios, legal offices, tutoring, equipment rentals, or bespoke services—describe your rules in plain English or paste any URL.',
    capabilities: [
      'Zero-code conversational setup in your own words',
      'Flexible hourly appointments or multi-day reservations',
      'Custom client labels (patient, guest, student, client)',
      'Upload any pricing, policy, or FAQ PDF for instant answers',
    ],
  },
];

export default function SolutionsPage() {
  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-16">
        <section className="max-w-3xl space-y-5">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Industry Solutions
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950 leading-[1.08]">
            Built for real-world service &amp; appointment workflows
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed">
            Every business has different rules—from pairing mechanics with repair bays to clinical
            safety guardrails. Start with an industry template or paste your website URL.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDUSTRIES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="rounded-3xl border border-neutral-200 bg-white p-8 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-semibold">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-neutral-950">{item.name}</h2>
                    <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{item.summary}</p>
                  </div>

                  <ul className="space-y-2 pt-2">
                    {item.capabilities.map((cap) => (
                      <li
                        key={cap}
                        className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">
                    {item.bookingStyle}
                  </span>
                  <Link
                    to="/register"
                    className="text-xs font-semibold text-neutral-950 hover:underline inline-flex items-center gap-1"
                  >
                    Start with this setup <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </PublicLayout>
  );
}
