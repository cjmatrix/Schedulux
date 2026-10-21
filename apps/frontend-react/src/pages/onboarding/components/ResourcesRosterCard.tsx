import { Check, Users } from 'lucide-react';
import React from 'react';
import type { OnboardingResourceItem } from '../types';

interface ResourcesRosterCardProps {
  resourcesList: OnboardingResourceItem[];
}

export const ResourcesRosterCard: React.FC<ResourcesRosterCardProps> = ({ resourcesList }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Practitioners &amp; Resources Roster
              </h3>
              <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {resourcesList.length} {resourcesList.length === 1 ? 'Resource' : 'Resources'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Clinical staff providers, treatment chairs, rooms, and active dispatch status
            </p>
          </div>
        </div>
      </div>

      {/* Table of Resources */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">PROVIDER / ASSET</th>
              <th className="py-3 px-4">TYPE &amp; CATEGORY</th>
              <th className="py-3 px-4">ASSIGNED SERVICES</th>
              <th className="py-3 px-4">DISPATCH STATUS</th>
              <th className="py-3 px-4 text-right">AI BOOKING</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resourcesList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  No practitioners or resources configured yet. Add your staff members or operatory
                  rooms in the chat.
                </td>
              </tr>
            ) : (
              resourcesList.map((res) => (
                <tr key={res.resource_id || res.idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 relative shadow-2xs">
                        <span>{res.initials}</span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            res.dispatch_status === 'active'
                              ? 'bg-emerald-500'
                              : res.dispatch_status === 'on_leave'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                          }`}
                        ></span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{res.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {res.title || res.category || res.resource_type || 'Staff Provider'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
                        {res.resource_type || 'staff'}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {res.category || 'Clinical'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {res.handledServices.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {res.handledServices.map((srv) => (
                          <span
                            key={srv.service_id}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                          >
                            {srv.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">All services</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${
                        res.dispatch_status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : res.dispatch_status === 'on_leave'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          res.dispatch_status === 'active'
                            ? 'bg-emerald-500'
                            : res.dispatch_status === 'on_leave'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                        }`}
                      ></span>
                      <span className="capitalize">{res.dispatch_status || 'active'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {res.is_bookable !== false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900">
                        <Check className="w-3.5 h-3.5 text-slate-600" />
                        <span>Bookable</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Internal</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-400 font-medium">
          Showing {resourcesList.length} providers with real-time slot conflict locking
        </span>
      </div>
    </div>
  );
};
