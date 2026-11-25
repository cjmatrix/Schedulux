import { initScheduluxWidget, type ScheduluxWidgetInstance } from '@repo/widget';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';

export default function PublicChatPage() {
  const { tenantId, agentId } = useParams<{ tenantId: string; agentId: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<ScheduluxWidgetInstance | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !agentId) {
      setInitError('Invalid booking link. Missing tenant or agent identifier.');
      return;
    }

    if (!containerRef.current) return;

    const customerApiBase = import.meta.env.VITE_CUSTOMER_GATEWAY_URL || 'http://localhost:5001';

    try {
      const instance = initScheduluxWidget({
        tenantId,
        agentId,
        apiBase: customerApiBase,
        container: containerRef.current,
        inline: true,
      });

      widgetInstanceRef.current = instance;
    } catch (err) {
      console.error('[PublicChatPage] Failed to initialize widget:', err);
      setInitError('Unable to load appointment assistant. Please refresh or try again later.');
    }

    return () => {
      if (widgetInstanceRef.current) {
        widgetInstanceRef.current.destroy();
        widgetInstanceRef.current = null;
      }
    };
  }, [tenantId, agentId]);

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid Booking Link</h2>
          <p className="text-sm text-slate-500 mb-6">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 sm:relative sm:inset-auto sm:h-screen sm:min-h-0 bg-white sm:bg-gradient-to-b sm:from-slate-100 sm:via-slate-50 sm:to-slate-100 flex flex-col sm:justify-center sm:items-center sm:p-4 overflow-hidden">
      {/* Main Container */}
      <main className="w-full h-full flex-1 min-h-0 sm:h-[720px] sm:max-w-2xl sm:mx-auto flex flex-col">
        <div className="w-full h-full flex-1 min-h-0 bg-white sm:rounded-2xl sm:shadow-xl sm:border sm:border-slate-200/80 flex flex-col overflow-hidden relative">
          <div ref={containerRef} className="w-full h-full flex-1 flex flex-col min-h-0" />
        </div>
      </main>
    </div>
  );
}
