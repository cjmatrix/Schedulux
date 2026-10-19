import React from 'react';
import { SlidersHorizontal, Bot, Paperclip, ArrowRight } from 'lucide-react';
import type { Operation } from 'fast-json-patch';
import type { Message } from '../types';
import { DiffDrawer } from './DiffDrawer';

interface WizardChatColumnProps {
  allMessages: Message[];
  status: 'idle' | 'loading' | 'awaiting_input' | 'processing';
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onToggleDiffDrawer: () => void;
  showDiffDrawer: boolean;
  diffPatches: Operation[];
  isDirty: boolean;
}

export const WizardChatColumn: React.FC<WizardChatColumnProps> = ({
  allMessages,
  status,
  inputValue,
  setInputValue,
  onSendMessage,
  onToggleDiffDrawer,
  showDiffDrawer,
  diffPatches,
  isDirty,
}) => {
  return (
    <div className="w-1/2 flex flex-col bg-white border-r border-slate-200 relative">
      {/* Subheader */}
      <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Glossy 3D Red Orb */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 via-rose-600 to-red-950 shadow-xs ring-2 ring-red-500/20 flex-shrink-0 animate-pulse"></div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Agent Architect</h2>
        </div>
        <button
          type="button"
          onClick={onToggleDiffDrawer}
          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition cursor-pointer"
          title="Agent Settings & Compilations"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Pending Changes Floating Drawer (if diffs exist) */}
      {showDiffDrawer && isDirty && (
        <DiffDrawer diffPatches={diffPatches} onClose={onToggleDiffDrawer} />
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Dynamic Conversation Messages */}
        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'tenant' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'tenant' ? (
              <div className="bg-neutral-950 text-white rounded-3xl p-4 shadow-sm max-w-[85%] space-y-1.5">
                <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-mono">
                  <span>✓ Compiled to Canvas</span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs max-w-[85%] space-y-1">
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-700">
                  <Bot className="w-3.5 h-3.5 text-slate-500" />
                  <span>Schedulux AI</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Processing indicator */}
        {status === 'processing' && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.15s' }}
              ></div>
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.3s' }}
              ></div>
              <span className="text-xs text-slate-400 font-semibold ml-2">Compiling to canvas...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Chat Input Form */}
      <div className="p-4 bg-white border-t border-slate-200/80">
        <form onSubmit={onSendMessage} className="space-y-2">
          <div className="bg-slate-50 border border-slate-200 rounded-full flex items-center px-4 py-2 gap-2 shadow-2xs focus-within:border-slate-400 focus-within:bg-white transition">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              title="Attach roster file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={status === 'processing' || status === 'loading'}
              placeholder="Type your business rules..."
              className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || status === 'processing' || status === 'loading'}
              className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 transition cursor-pointer shadow-xs active:scale-95"
              title="Compile instruction"
            >
              <ArrowRight className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Deterministic compiler: Changes reflect immediately in live preview • Synced
            </span>
            <span className="font-mono">Press Return ↵</span>
          </div>
        </form>
      </div>
    </div>
  );
};
