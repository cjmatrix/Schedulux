import { initScheduluxWidget, type ScheduluxWidgetInstance, type WidgetConfig } from '@repo/widget';
import { Bot, Monitor, Palette, RotateCcw, Smartphone } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface SandboxSimulationProps {
  clinicName?: string;
  tenantId?: string;
  agentId?: string;
  widgetConfig?: Partial<WidgetConfig>;
}

export const SandboxSimulation: React.FC<SandboxSimulationProps> = ({
  clinicName = 'AI Scheduling Agent',
  tenantId = 'sandbox_tenant',
  agentId = 'sandbox_agent',
  widgetConfig,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<ScheduluxWidgetInstance | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const configRef = useRef(widgetConfig);
  configRef.current = widgetConfig;

  const primaryColor = widgetConfig?.theme?.primary_color || '#4F46E5';
  const themeMode = widgetConfig?.theme?.theme_mode || 'light';
  const launcherStyle = widgetConfig?.launcher_style || 'bubble';

  useEffect(() => {
    if (!mountRef.current) return;

    mountRef.current.innerHTML = '';

    const currentCfg = configRef.current;

    const instance = initScheduluxWidget({
      tenantId: tenantId || 'sandbox_tenant',
      agentId: agentId || 'sandbox_agent',
      apiBase: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      container: mountRef.current,
      inline: true,
      mode: 'sandbox',
      config: currentCfg,
    });

    widgetInstanceRef.current = instance;

    return () => {
      instance.destroy();
      widgetInstanceRef.current = null;
    };
  }, [tenantId, agentId]);

  useEffect(() => {
    if (widgetInstanceRef.current && widgetConfig) {
      widgetInstanceRef.current.updateConfig(widgetConfig);
    }
  }, [widgetConfig]);

  const handleReset = () => {
    if (widgetInstanceRef.current) {
      widgetInstanceRef.current.resetConversation();
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex flex-col h-[700px] overflow-hidden">
      {/* Studio Sandbox Toolbar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">{clinicName} Sandbox</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agent
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-400" />
                Theme:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[10px] text-slate-700 font-semibold">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                />
                {primaryColor}
              </span>
              <span className="capitalize text-slate-400 text-[10px]">• {themeMode} mode</span>
              <span className="capitalize text-slate-400 text-[10px]">• {launcherStyle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Device Preview Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 mr-1">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-white shadow-2xs text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Desktop inline view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-white shadow-2xs text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Mobile device view"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            title="Reset sandbox conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Widget Mounting Stage */}
      <div className="flex-1 min-h-0 pt-3 flex items-center justify-center bg-slate-50/50 rounded-2xl overflow-hidden">
        {previewDevice === 'desktop' ? (
          <div ref={mountRef} className="w-full h-full min-h-0 flex flex-col overflow-hidden" />
        ) : (
          <div className="w-[360px] h-[96%] bg-slate-900 rounded-[36px] p-2.5 shadow-xl flex flex-col border border-slate-700/60">
            {/* Phone speaker notch */}
            <div className="w-24 h-3.5 bg-slate-950 rounded-full mx-auto mb-1 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>
            <div
              ref={mountRef}
              className="flex-1 min-h-0 w-full rounded-[28px] overflow-hidden flex flex-col bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};
