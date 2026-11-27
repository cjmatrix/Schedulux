import { ChevronDown, ChevronRight, Clock, Info, Layers, ShieldCheck, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { OnboardingServiceItem } from '../types';
import { formatPrice, getInitials } from '../utils';

interface ServicesCatalogCardProps {
  servicesList: OnboardingServiceItem[];
  currency: string;
}

export const ServicesCatalogCard: React.FC<ServicesCatalogCardProps> = ({
  servicesList,
  currency,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Services &amp; Pricing Catalog</h3>
              <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                {servicesList.length} {servicesList.length === 1 ? 'Service' : 'Services'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Clinical offerings, slot lengths, turnover buffers, and pricing rules
            </p>
          </div>
        </div>
      </div>

      {/* Table of Services */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">SERVICE &amp; CATEGORY</th>
              <th className="py-3 px-4">DURATION &amp; BUFFER</th>
              <th className="py-3 px-4">PRICE &amp; VERIFICATION</th>
              <th className="py-3 px-4">ELIGIBLE PROVIDERS</th>
              <th className="py-3 px-4 text-right">BOOKING MODEL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servicesList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  No services configured yet. Tell the AI assistant what services your clinic or
                  business offers.
                </td>
              </tr>
            ) : (
              servicesList.map((srv) => {
                const srvKey = srv.service_id || String(srv.idx);
                const isExpanded = expandedId === srvKey;

                return (
                  <React.Fragment key={srvKey}>
                    <tr
                      onClick={() => toggleExpand(srvKey)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isExpanded ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            className="mt-0.5 text-slate-400 hover:text-slate-600 transition"
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-xs">{srv.name}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                {srv.category || 'General'}
                              </span>
                              {srv.service_id && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  {srv.service_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {srv.duration_minutes || 30} mins
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            {srv.buffer_minutes ? `+${srv.buffer_minutes}m buffer` : 'No buffer'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            {formatPrice(
                              srv.price?.amount,
                              srv.price?.currency || currency,
                              srv.price?.type,
                            )}
                          </p>
                          {srv.verification?.require_otp ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.2 rounded-full inline-block">
                              OTP Verification
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Direct booking</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {srv.assignedStaff && srv.assignedStaff.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {srv.assignedStaff.map((staff) => (
                              <span
                                key={staff.resource_id}
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium px-2.5 py-0.5 rounded-full transition"
                                title={staff.title || staff.name}
                              >
                                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">
                                  {getInitials(staff.name, 'S')}
                                </span>
                                <span>{staff.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            All available staff
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex flex-col items-end gap-0.5">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            {srv.booking_mode || 'time_slot'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {srv.booking_mode?.replace('_', ' ') || 'time slot'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-100 text-xs">
                        <td colSpan={5} className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                            {/* Detailed Description */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Info className="w-3 h-3 text-slate-400" />
                                Service Description
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {srv.description || (
                                  <span className="text-slate-400 italic font-normal">
                                    No detailed description provided. Ask the AI assistant to add
                                    one.
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Resource Requirements & Selection Rules */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                Resource Allocation Rules
                              </span>
                              {srv.resource_requirements && srv.resource_requirements.length > 0 ? (
                                <div className="space-y-1.5">
                                  {srv.resource_requirements.map((req, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200/60"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800">
                                          {req.role || 'Provider'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 ml-1.5">
                                          ({req.resource_type || 'staff'}) × {req.count || 1}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                          req.selection_mode === 'auto_assign'
                                            ? 'bg-slate-200 text-slate-700'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                        }`}
                                      >
                                        {req.selection_mode === 'auto_assign'
                                          ? 'Auto Assigned'
                                          : 'User Selectable'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">
                                  Default single provider requirement.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* OTP & Security Notes */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>
                              Verification Policy:{' '}
                              <strong>
                                {srv.verification?.require_otp === true
                                  ? 'Strict SMS OTP Verification enforced before slot booking'
                                  : srv.verification?.require_otp === false
                                    ? 'Instant confirmation without customer OTP'
                                    : 'Inherits global tenant security guardrails'}
                              </strong>
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-400 font-medium">
          Showing {servicesList.length} procedures configured in agent runtime
        </span>
        <span className="text-[11px] text-slate-400 italic">
          Click any row to view description &amp; allocation rules
        </span>
      </div>
    </div>
  );
};
