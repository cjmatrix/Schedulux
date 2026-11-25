import { initScheduluxWidget, type ScheduluxWidgetInstance, type WidgetConfig } from '@repo/widget';
import { Bot, Monitor, Palette, RotateCcw, Smartphone } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface SandboxSimulationProps {
  clinicName?: string;
  tenantId?: string;
  agentId?: string;
  widgetConfig?: Partial<WidgetConfig>;
  isLive?: boolean;
}

export const SandboxSimulation: React.FC<SandboxSimulationProps> = ({
  clinicName = 'AI Scheduling Agent',
  tenantId = 'sandbox_tenant',
  agentId = 'sandbox_agent',
  widgetConfig,
  isLive = false,
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
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    mountRef.current.appendChild(container);

    const currentCfg = configRef.current;

    const instance = initScheduluxWidget({
      tenantId: tenantId || 'sandbox_tenant',
      agentId: agentId || 'sandbox_agent',
      apiBase: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      container,
      inline: true,
      mode: 'sandbox',
      config: currentCfg,
      onSendMessage: !isLive
        ? async (_text: string) => {
            await new Promise((resolve) => setTimeout(resolve, 350));
            return {
              response:
                "👋 I'm in Draft Preview mode! Your theme and branding look great. Click 'Publish Agent' in the top right to start live testing appointments with me.",
            };
          }
        : undefined,
    });

    widgetInstanceRef.current = instance;

    return () => {
      instance.destroy();
      widgetInstanceRef.current = null;
      container.remove();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [tenantId, agentId, isLive]);

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
    <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs flex flex-col h-[620px] sm:h-[700px] overflow-hidden">
      <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-slate-100 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex-shrink-0 ${
              isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            } flex items-center justify-center font-bold`}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {clinicName}
                <span className="hidden sm:inline"> Sandbox</span>
              </h3>
              {isLive ? (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Agent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-[11px] text-slate-500 overflow-hidden">
              <span className="hidden sm:inline-flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-400" />
                Theme:
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[9px] sm:text-[10px] text-slate-700 font-semibold flex-shrink-0">
                <span
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                />
                {primaryColor}
              </span>
              <span className="capitalize text-slate-400 text-[10px] truncate">• {themeMode} mode</span>
              <span className="hidden sm:inline capitalize text-slate-400 text-[10px]">• {launcherStyle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 mr-1">
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
