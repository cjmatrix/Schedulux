import { Bot, RotateCcw, Sparkles } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

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
  onResetSandbox?: () => void;
}

const QUICK_PROMPTS = [
  'What services do you provide?',
  'Check available appointment times',
  'What are your operating hours?',
];

export const SandboxSimulation: React.FC<SandboxSimulationProps> = ({
  clinicName,
  sandboxMessages,
  setSandboxMessages,
  sandboxInput,
  setSandboxInput,
  isSandboxTyping,
  onSendSandboxMessage,
  onResetSandbox,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sandboxMessages, isSandboxTyping]);

  const handleReset = () => {
    if (onResetSandbox) {
      onResetSandbox();
    } else {
      setSandboxMessages([
        {
          role: 'agent',
          text: `Hello! Welcome to ${clinicName}. How can I assist you with scheduling or consultations today?`,
        },
      ]);
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    setSandboxInput(prompt);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col h-[650px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Test Sandbox Simulation</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agent
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Conversational test interacting with services & real-time slot engine
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          title="Reset sandbox conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Sandbox Message Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
        {sandboxMessages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
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
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Agent is checking availability and generating response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="pt-2 pb-2 flex flex-wrap gap-1.5 items-center">
        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mr-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleQuickPromptClick(prompt)}
            disabled={isSandboxTyping}
            className="text-[11px] bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 rounded-lg px-2.5 py-1 transition cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Sandbox Input Form */}
      <form onSubmit={onSendSandboxMessage} className="pt-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={sandboxInput}
          onChange={(e) => setSandboxInput(e.target.value)}
          placeholder="Ask a question or request an appointment..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          disabled={isSandboxTyping}
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
