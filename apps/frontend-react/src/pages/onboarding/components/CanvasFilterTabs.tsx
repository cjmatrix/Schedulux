import React from 'react';
import type { CanvasModule } from '../types';

interface CanvasFilterTabsProps {
  canvasModule: CanvasModule;
  setCanvasModule: (mod: CanvasModule) => void;
  servicesCount: number;
  resourcesCount: number;
}

export const CanvasFilterTabs: React.FC<CanvasFilterTabsProps> = ({
  canvasModule,
  setCanvasModule,
  servicesCount,
  resourcesCount,
}) => {
  const tabs = [
    { id: 'all' as const, label: 'All Modules' },
    { id: 'profile' as const, label: 'Business Profile' },
    { id: 'services' as const, label: 'Services Catalog', count: servicesCount },
    { id: 'resources' as const, label: 'Resources Roster', count: resourcesCount },
    { id: 'guardrails' as const, label: 'Security Guardrails', count: 3 },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
      {tabs.map((tab) => {
        const isActive = canvasModule === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCanvasModule(tab.id)}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
              isActive
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
