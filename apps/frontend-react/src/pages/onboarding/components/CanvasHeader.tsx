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
  isLive?: boolean;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  rightViewMode,
  setRightViewMode,
  isDirty,
  pendingChangesCount,
  isSavingChanges,
  onSaveChanges,
  isLive = false,
}) => {
  return (
    <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between sticky top-0 z-20 shadow-2xs gap-2">
      <div className="flex items-center gap-0.5 sm:gap-1.5 bg-slate-100 p-0.5 sm:p-1 rounded-full text-xs font-semibold no-scrollbar flex-shrink-0">
        <button
          type="button"
          onClick={() => setRightViewMode('rules')}
          className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
            rightViewMode === 'rules'
              ? 'bg-slate-900 text-white shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="hidden sm:inline">• Logic &amp; Rules</span>
          <span className="sm:hidden">• Rules</span>
        </button>
        <button
          type="button"
          onClick={() => setRightViewMode('sandbox')}
          title={
            isLive
              ? 'Test your live agent in the sandbox'
              : 'Preview widget theme and branding in draft mode'
          }
          className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
            rightViewMode === 'sandbox'
              ? 'bg-slate-900 text-white shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="hidden sm:inline">Test Sandbox</span>
          <span className="sm:hidden">Sandbox</span>
        </button>
        <button
          type="button"
          onClick={() => setRightViewMode('json')}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition cursor-pointer flex items-center gap-1 whitespace-nowrap text-[11px] sm:text-xs ${
            rightViewMode === 'json'
              ? 'bg-slate-900 text-white shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="View Raw JSON Schema"
        >
          <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>JSON</span>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isDirty && (
          <span className="hidden md:inline-flex text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            {pendingChangesCount} changes pending
          </span>
        )}
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={isSavingChanges}
          className="bg-neutral-950 hover:bg-black text-white px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 flex items-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          {isSavingChanges ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isSavingChanges ? 'Publishing...' : 'Publish Agent'}
          </span>
          <span className="sm:hidden">
            {isSavingChanges ? 'Saving...' : 'Publish'}
          </span>
        </button>
      </div>
    </div>
  );
};
