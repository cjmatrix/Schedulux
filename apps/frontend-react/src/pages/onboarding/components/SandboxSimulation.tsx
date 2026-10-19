import React from 'react';
import { Bot, RotateCcw } from 'lucide-react';

interface SandboxSimulationProps {
  clinicName: string;
  sandboxMessages: Array<{ role: 'user' | 'agent'; text: string }>;
  setSandboxMessages: React.Dispatch<
    React.SetStateAction<Array<{ role: 'user' | 'agent'; text: string }>>
  >;
  sandboxInput: string;
  setSandboxInput: (val: string) => void;
  isSandboxTyping: boolean;
  onSendSandboxMessage: (e: React.FormEvent) => void;
}

export const SandboxSimulation: React.FC<SandboxSimulationProps> = ({
  clinicName,
  sandboxMessages,
  setSandboxMessages,
  sandboxInput,
  setSandboxInput,
  isSandboxTyping,
  onSendSandboxMessage,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col h-[650px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Test Sandbox Simulation</h3>
            <p className="text-xs text-slate-500">
              Live conversational test powered by compiled rules
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setSandboxMessages([
              {
                role: 'agent',
                text: `Hello! Welcome to ${clinicName}. How can I assist you with scheduling or consultations today?`,
              },
            ])
          }
          className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition cursor-pointer"
          title="Reset sandbox"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Sandbox Message Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {sandboxMessages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-neutral-950 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isSandboxTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-400 font-semibold animate-pulse">
              Agent is replying...
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Input Form */}
      <form onSubmit={onSendSandboxMessage} className="pt-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={sandboxInput}
          onChange={(e) => setSandboxInput(e.target.value)}
          placeholder="Try: Can I book an appointment with Doctor A next Tuesday?"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          disabled={!sandboxInput.trim() || isSandboxTyping}
          className="px-4 py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 transition cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
};
