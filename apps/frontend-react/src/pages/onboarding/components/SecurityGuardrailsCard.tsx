import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface SecurityGuardrailsCardProps {
  requireOtp: boolean;
  phiScrubbing: boolean;
  emergencyTriage: boolean;
}

export const SecurityGuardrailsCard: React.FC<SecurityGuardrailsCardProps> = ({
  requireOtp,
  phiScrubbing,
  emergencyTriage,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Security &amp; Intake Guardrails</h3>
            <p className="text-xs text-slate-500">
              Strict deterministic policies enforced before conversation response generation
            </p>
          </div>
        </div>
        <span
          className={`font-extrabold text-[10px] px-3 py-1 rounded-md tracking-wider uppercase ${
            phiScrubbing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {phiScrubbing ? 'HIPAA COMPLIANT' : 'STANDARD MODE'}
        </span>
      </div>

      {/* Guardrail Items */}
      <div className="space-y-4 pt-1">
        {/* Item 1: SMS OTP */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Require SMS OTP Verification
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  requireOtp ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {requireOtp ? 'Mandatory' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
              Requires two-factor phone verification before revealing patient history or
              rescheduling existing appointments.
            </p>
          </div>
          <div
            className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-default select-none pointer-events-none ${
              requireOtp ? 'bg-slate-950 justify-end' : 'bg-slate-200 justify-start'
            }`}
            title={requireOtp ? 'Active in schema' : 'Inactive in schema'}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
          </div>
        </div>

        {/* Item 2: PHI Scrubbing */}
        <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Automated PHI Scrubbing &amp; Data Redaction
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  phiScrubbing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {phiScrubbing ? 'Deterministic' : 'Inactive'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
              Automatic redaction of sensitive patient identifiers, social security numbers, and
              intake charts before third-party model inference.
            </p>
          </div>
          <div
            className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-default select-none pointer-events-none ${
              phiScrubbing ? 'bg-slate-950 justify-end' : 'bg-slate-200 justify-start'
            }`}
            title={phiScrubbing ? 'Active in schema' : 'Inactive in schema'}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
          </div>
        </div>

        {/* Item 3: Emergency Triage */}
        <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Acute Emergency Triage Deflection
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  emergencyTriage ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {emergencyTriage ? '911 Redirection' : 'Inactive'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
              Immediate deflection to emergency line when chest pain, severe trauma, or acute
              cardiac anomalies are detected in conversation.
            </p>
          </div>
          <div
            className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-default select-none pointer-events-none ${
              emergencyTriage ? 'bg-slate-950 justify-end' : 'bg-slate-200 justify-start'
            }`}
            title={emergencyTriage ? 'Active in schema' : 'Inactive in schema'}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
