import {
  AlertTriangle,
  BadgeCheck,
  Check,
  FileLock2,
  Headphones,
  KeyRound,
  PhoneCall,
  ShieldCheck,
  X,
} from 'lucide-react';
import React from 'react';

export interface VerificationPolicyData {
  require_otp_for_new_booking?: boolean;
  require_otp_for_reschedule?: boolean;
  require_otp_for_cancel?: boolean;
}

export interface PhiScrubbingData {
  enabled?: boolean;
  policy?: string | null;
  description?: string | null;
  hipaa_compliant?: boolean;
}

export interface TriageEmergencyData {
  enabled?: boolean;
  keywords?: string[];
  response_override?: string | null;
}

export interface HumanHandoffData {
  enabled?: boolean;
  trigger_topics?: string[];
  reception_contact?: string | null;
  handoff_message?: string | null;
}

export interface GuardrailsData {
  verification_policy?: VerificationPolicyData | null;
  phi_scrubbing?: PhiScrubbingData | null;
  triage_emergency?: TriageEmergencyData | null;
  human_handoff?: HumanHandoffData | null;
}

interface SecurityGuardrailsCardProps {
  guardrails?: GuardrailsData;
  requireOtp?: boolean;
  phiScrubbing?: boolean;
  emergencyTriage?: boolean;
}

export const SecurityGuardrailsCard: React.FC<SecurityGuardrailsCardProps> = ({
  guardrails,
  requireOtp: legacyRequireOtp,
  phiScrubbing: legacyPhiScrubbing,
  emergencyTriage: legacyEmergencyTriage,
}) => {
  const vp = guardrails?.verification_policy;
  const phi = guardrails?.phi_scrubbing;
  const triage = guardrails?.triage_emergency;
  const handoff = guardrails?.human_handoff;

  const isNewBookingOtp = Boolean(vp?.require_otp_for_new_booking ?? false);
  const isRescheduleOtp = Boolean(vp?.require_otp_for_reschedule ?? legacyRequireOtp ?? false);
  const isCancelOtp = Boolean(vp?.require_otp_for_cancel ?? false);

  const isPhiEnabled = Boolean(phi?.enabled ?? legacyPhiScrubbing ?? false);
  const isHipaaCompliant = Boolean(phi?.hipaa_compliant ?? false);
  const phiPolicy = phi?.policy || null;
  const phiDescription = phi?.description || null;

  const isTriageEnabled = Boolean(triage?.enabled ?? legacyEmergencyTriage ?? false);
  const triageKeywords = Array.isArray(triage?.keywords) ? triage.keywords : [];
  const triageResponse = triage?.response_override || null;

  const isHandoffEnabled = Boolean(handoff?.enabled ?? false);
  const handoffTopics = Array.isArray(handoff?.trigger_topics) ? handoff.trigger_topics : [];
  const receptionPhone = handoff?.reception_contact || null;
  const handoffMessage = handoff?.handoff_message || null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
      {/* ── CARD HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Security &amp; Intake Guardrails</h3>
            <p className="text-xs text-slate-500">
              Deterministic policies enforced before conversation response generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHipaaCompliant && (
            <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              HIPAA COMPLIANT
            </span>
          )}
          {phiPolicy && (
            <span className="font-extrabold text-[10px] px-3 py-1 rounded-full tracking-wider uppercase bg-slate-900 text-white">
              {phiPolicy.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* ── 4 GUARDRAIL MODULES ── */}
      <div className="space-y-6 divide-y divide-slate-100">
        {/* MODULE 1: VERIFICATION POLICY */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Two-Factor Identity Verification Policy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* New Booking */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isNewBookingOtp
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">New Booking</span>
                {isNewBookingOtp ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <p className={`text-[10px] ${isNewBookingOtp ? 'text-slate-300' : 'text-slate-500'}`}>
                {isNewBookingOtp ? 'OTP Mandatory' : 'Direct Booking (No OTP)'}
              </p>
            </div>

            {/* Rescheduling */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isRescheduleOtp
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">Reschedule</span>
                {isRescheduleOtp ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <p className={`text-[10px] ${isRescheduleOtp ? 'text-slate-300' : 'text-slate-500'}`}>
                {isRescheduleOtp ? 'OTP Mandatory' : 'Direct Reschedule (No OTP)'}
              </p>
            </div>

            {/* Cancellation */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isCancelOtp
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">Cancellation</span>
                {isCancelOtp ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <p className={`text-[10px] ${isCancelOtp ? 'text-slate-300' : 'text-slate-500'}`}>
                {isCancelOtp ? 'OTP Mandatory' : 'Direct Cancellation (No OTP)'}
              </p>
            </div>
          </div>
        </div>

        {/* MODULE 2: DATA PRIVACY & PHI SCRUBBING */}
        <div className="pt-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileLock2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Data Privacy &amp; PHI Scrubbing
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPhiEnabled ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isPhiEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl pl-8">
                {phiDescription ||
                  (isPhiEnabled
                    ? 'Automated tokenization and redaction of sensitive client data before LLM inference.'
                    : 'Data redaction guardrail is not configured for this agent.')}
              </p>
            </div>

            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-default select-none ${
                isPhiEnabled ? 'bg-slate-950 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
            </div>
          </div>
        </div>

        {/* MODULE 3: EMERGENCY & SAFETY TRIAGE */}
        <div className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Emergency / Safety Triage Deflection
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isTriageEnabled
                      ? 'bg-rose-100 text-rose-800 border border-rose-200/80'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isTriageEnabled ? 'Deflection Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl pl-8">
                {isTriageEnabled
                  ? 'Immediate deflection to emergency response lines when acute safety or critical issues are detected.'
                  : 'Emergency triage deflection is not configured for this agent.'}
              </p>
            </div>

            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-default select-none ${
                isTriageEnabled ? 'bg-slate-950 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
            </div>
          </div>

          <div className="ml-8 space-y-2.5">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Trigger Keywords:
              </span>
              {triageKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {triageKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-rose-50/70 border border-rose-100 text-rose-900 px-2 py-0.5 rounded-md"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No trigger keywords defined in schema yet.
                </p>
              )}
            </div>

            {triageResponse && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider mb-1">
                  Deflection Response Script:
                </span>
                <p className="italic text-slate-700 leading-relaxed">"{triageResponse}"</p>
              </div>
            )}
          </div>
        </div>

        {/* MODULE 4: HUMAN ESCALATION & STAFF HANDOFF */}
        <div className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Human Escalation &amp; Live Staff Handoff
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isHandoffEnabled ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isHandoffEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl pl-8">
                {isHandoffEnabled
                  ? 'Seamless handoff to human front desk or staff when customer inquiries exceed automated capabilities.'
                  : 'Live staff handoff is not configured for this agent.'}
              </p>
            </div>

            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 cursor-default select-none ${
                isHandoffEnabled ? 'bg-slate-950 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
            </div>
          </div>

          <div className="ml-8 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Staff Contact:
              </span>
              {receptionPhone ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
                  <PhoneCall className="w-3 h-3 text-amber-600" />
                  {receptionPhone}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Not configured</span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Escalation Topics:
              </span>
              {handoffTopics.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {handoffTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No specific handoff topics defined in schema yet.
                </p>
              )}
            </div>

            {handoffMessage && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider mb-1">
                  Live Transfer Prompt:
                </span>
                <p className="italic text-slate-700 leading-relaxed">"{handoffMessage}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
