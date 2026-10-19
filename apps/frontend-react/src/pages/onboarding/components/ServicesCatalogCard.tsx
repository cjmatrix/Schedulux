import React from 'react';
import { Layers, Clock } from 'lucide-react';
import { formatPrice, getInitials } from '../utils';

interface ServicesCatalogCardProps {
  servicesList: any[];
  currency: string;
}

export const ServicesCatalogCard: React.FC<ServicesCatalogCardProps> = ({
  servicesList,
  currency,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Services &amp; Pricing Catalog</h3>
              <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
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
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">SERVICE &amp; CATEGORY</th>
              <th className="py-3 px-4">DURATION &amp; BUFFER</th>
              <th className="py-3 px-4">PRICE &amp; DEPOSIT</th>
              <th className="py-3 px-4">ELIGIBLE PROVIDERS</th>
              <th className="py-3 px-4 text-right">BOOKING MODEL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servicesList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  No services configured yet. Tell the AI assistant what services your clinic or business offers.
                </td>
              </tr>
            ) : (
              servicesList.map((srv: any) => (
                <tr key={srv.service_id || srv.idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-xs">{srv.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {srv.category || 'General'}
                        </span>
                        {srv.recall_interval_days > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {srv.recall_interval_days}d recall
                          </span>
                        )}
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
                          srv.price?.type
                        )}
                      </p>
                      {srv.deposit?.required ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.2 rounded-full inline-block">
                          Deposit: {formatPrice(srv.deposit.amount, srv.price?.currency || currency)} ({srv.deposit.processor === 'upi_direct' ? 'UPI' : srv.deposit.processor})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No deposit</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {srv.assignedStaff.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {srv.assignedStaff.map((staff: any) => (
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
                        {srv.allocation_model?.replace('_', ' ') || 'single resource'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-400 font-medium">
          Showing {servicesList.length} procedures configured in agent runtime
        </span>
      </div>
    </div>
  );
};
