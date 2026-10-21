import { Code2, Loader2, Rocket } from 'lucide-react';
import React from 'react';
import type { RightViewMode } from '../types';

interface CanvasHeaderProps {
  rightViewMode: RightViewMode;
  setRightViewMode: (mode: RightViewMode) => void;
  isDirty: boolean;
  pendingChangesCount: number;
  isSavingChanges: boolean;
  onSaveChanges: () => void;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  rightViewMode,
  setRightViewMode,
  isDirty,
  pendingChangesCount,
  isSavingChanges,
  onSaveChanges,
}) => {
  return (
    <div className="px-8 py-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full text-xs font-semibold">
        <button
          type="button"
          onClick={() => setRightViewMode('rules')}
          className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
            rightViewMode === 'rules'
              ? 'bg-slate-900 text-white shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          • Logic &amp; Rules
        </button>
        <button
          type="button"
          onClick={() => setRightViewMode('sandbox')}
          className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
            rightViewMode === 'sandbox'
              ? 'bg-slate-900 text-white shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Test Sandbox
        </button>
        <button
          type="button"
          onClick={() => setRightViewMode('json')}
          className={`px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1 ${
            rightViewMode === 'json'
              ? 'bg-slate-900 text-white shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="View Raw JSON Schema"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>JSON</span>
        </button>
      </div>

      {/* Right Action: Publish Agent */}
      <div className="flex items-center gap-3">
        {isDirty && (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            {pendingChangesCount} changes pending
          </span>
        )}
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={isSavingChanges}
          className="bg-neutral-950 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSavingChanges ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}
          <span>{isSavingChanges ? 'Publishing...' : 'Publish Agent'}</span>
        </button>
      </div>
    </div>
  );
};
