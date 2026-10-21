import type { Operation } from 'fast-json-patch';
import { FileDiff, X } from 'lucide-react';
import React from 'react';

interface DiffDrawerProps {
  diffPatches: Operation[];
  onClose: () => void;
}

export const DiffDrawer: React.FC<DiffDrawerProps> = ({ diffPatches, onClose }) => {
  return (
    <div className="absolute top-[96px] left-6 right-6 z-40 bg-white border border-amber-200 rounded-3xl shadow-2xl p-5 max-h-[300px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileDiff className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold text-slate-900">
            Compiled Schema Patches ({diffPatches.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs">
        {diffPatches.map((patch, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
          >
            <div className="space-y-0.5">
              <span className="font-mono text-[11px] font-semibold text-slate-800 break-all">
                {patch.path.replace(/^\//, '').split('/').join(' › ')}
              </span>
              <div className="text-[11px] text-slate-500 font-mono">
                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mr-1.5">
                  {patch.op}
                </span>
                {'value' in patch ? (
                  <span className="text-emerald-700 font-semibold">
                    {typeof patch.value === 'object' && patch.value !== null
                      ? JSON.stringify(patch.value).slice(0, 45) + '...'
                      : String(patch.value)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
