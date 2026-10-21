import { User } from 'lucide-react';
import React from 'react';

interface WizardHeaderProps {
  onNavigateAgents: () => void;
  onNavigateDashboard: () => void;
  onNavigateProfile: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  onNavigateAgents,
  onNavigateDashboard,
  onNavigateProfile,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between z-30 shadow-2xs">
      {/* Left Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateAgents}
          className="flex items-center gap-2 group cursor-pointer"
          title="Back to Agent Studio"
        >
          <div className="flex items-center gap-1">
            <span className="w-1 h-4 bg-slate-900 rounded-full"></span>
            <span className="w-1 h-5 bg-slate-900 rounded-full"></span>
            <span className="w-1 h-3.5 bg-slate-900 rounded-full"></span>
            <span className="w-1 h-5 bg-slate-900 rounded-full"></span>
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-950">
            Schedulux AI
          </span>
        </button>
      </div>

      {/* Center Pill Switch */}
      <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold">
        <button
          type="button"
          className="bg-white text-slate-900 shadow-2xs px-4 py-1.5 rounded-full cursor-default"
        >
          Agent Studio
        </button>
        <button
          type="button"
          onClick={onNavigateDashboard}
          className="text-slate-500 hover:text-slate-900 px-4 py-1.5 rounded-full transition cursor-pointer"
        >
          Dashboard
        </button>
      </div>

      {/* Right Status & Profile */}
      <div className="flex items-center gap-3">
        <span className="border border-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          PRODUCTION
        </span>
        <button
          onClick={onNavigateProfile}
          className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center hover:bg-black transition cursor-pointer shadow-2xs"
          title="Tenant Account"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
