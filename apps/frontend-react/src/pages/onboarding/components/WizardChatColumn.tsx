import type { Operation } from 'fast-json-patch';
import { AlertTriangle, ArrowRight, Bot, Paperclip, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { Message } from '../types.js';
import { DiffDrawer } from './DiffDrawer.js';
import { renderMarkdown } from '../../../utils/markdown.js';

const MAX_TENANT_INPUT_CHARS = 20000; // ~5,000 tokens (1 token ≈ 4 chars)

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
  hasPreviousPage?: boolean;
  isFetchingPreviousPage?: boolean;
  onLoadPreviousMessages?: () => void;
  firstItemIndex?: number;
  className?: string;
  onNavigateToCanvas?: () => void;
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
  hasPreviousPage,
  isFetchingPreviousPage,
  onLoadPreviousMessages,
  firstItemIndex,
  className,
  onNavigateToCanvas,
}) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isAtBottomRef = useRef(true);
  const lastMsg = allMessages[allMessages.length - 1];
  const lastMessageKey = lastMsg
    ? `${(firstItemIndex ?? 0) + allMessages.length - 1}:${lastMsg.role}:${lastMsg.text.length}`
    : '';
  const prevLastMessageKeyRef = useRef<string>(lastMessageKey);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const statusJustStartedProcessing =
      status === 'processing' && prevStatusRef.current !== 'processing';
    const lastMessageChanged = lastMessageKey !== prevLastMessageKeyRef.current;

    prevStatusRef.current = status;
    prevLastMessageKeyRef.current = lastMessageKey;

    if (!statusJustStartedProcessing && !lastMessageChanged) {
      return;
    }

    const shouldForceScroll = statusJustStartedProcessing || lastMsg?.role === 'tenant';
    if (!shouldForceScroll && !isAtBottomRef.current) {
      return;
    }

    if (shouldForceScroll) {
      isAtBottomRef.current = true;
    }

    const scrollToBottom = () => {
      virtuosoRef.current?.scrollTo({
        top: Number.MAX_SAFE_INTEGER,
        behavior: 'smooth',
      });
    };

    const rafId = requestAnimationFrame(scrollToBottom);
    const timerId = window.setTimeout(scrollToBottom, 60);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [lastMessageKey, lastMsg?.role, status]);

  return (
    <div
      className={
        className ||
        'w-full lg:w-1/2 flex flex-col bg-white border-r border-slate-200 relative h-full min-h-0'
      }
    >
      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
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

      {/* Always-visible AI accuracy reminder */}
      <div className="px-4 sm:px-6 py-2 bg-amber-50/80 border-b border-amber-200/70 flex items-center gap-2 text-[11px] text-amber-900 flex-shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <p className="leading-snug">
          <span className="font-semibold">AI can make mistakes.</span> Always check the{' '}
          {onNavigateToCanvas ? (
            <button
              type="button"
              onClick={onNavigateToCanvas}
              className="lg:hidden font-semibold underline underline-offset-2 cursor-pointer"
            >
              Canvas
            </button>
          ) : null}
          <span className={onNavigateToCanvas ? 'hidden lg:inline font-semibold' : 'font-semibold'}>
            Canvas
          </span>{' '}
          to verify your services, hours, and rules before publishing.
        </p>
      </div>

      {/* Pending Changes Floating Drawer (if diffs exist) */}
      {showDiffDrawer && isDirty && (
        <DiffDrawer diffPatches={diffPatches} onClose={onToggleDiffDrawer} />
      )}

      {/* Virtualized Message Stream with React Virtuoso */}
      <div className="flex-1 min-h-0 relative">
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%' }}
          data={allMessages}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={allMessages.length > 0 ? allMessages.length - 1 : 0}
          atBottomThreshold={60}
          atBottomStateChange={(atBottom) => {
            isAtBottomRef.current = atBottom;
          }}
          followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
          startReached={() => {
            if (hasPreviousPage && !isFetchingPreviousPage && onLoadPreviousMessages) {
              onLoadPreviousMessages();
            }
          }}
          itemContent={(_index, msg) => (
            <div className="px-6 py-2">
              <div className={`flex ${msg.role === 'tenant' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'tenant' ? (
                  <div className="bg-neutral-950 text-white rounded-3xl p-4 shadow-sm max-w-[85%] space-y-1.5">
                    <p className="text-[13px] leading-relaxed font-medium">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-mono">
                      <span>✓ Compiled to Canvas</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs max-w-[85%] space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-700">
                      <Bot className="w-3.5 h-3.5 text-slate-500" />
                      <span>Schedulux AI</span>
                    </div>
                    <div
                      className="text-[13px] text-slate-800 leading-relaxed wizard-markdown"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          components={{
            Header: () => (
              <div className="py-3 text-center">
                {isFetchingPreviousPage ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading earlier conversation...</span>
                  </div>
                ) : hasPreviousPage ? (
                  <button
                    type="button"
                    onClick={onLoadPreviousMessages}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition cursor-pointer"
                  >
                    ↑ Load earlier conversation
                  </button>
                ) : allMessages.length > 0 ? (
                  <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                    Beginning of conversation
                  </span>
                ) : null}
              </div>
            ),
            Footer: () =>
              status === 'processing' ? (
                <div className="px-6 py-2 flex justify-start">
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
                    <span className="text-xs text-slate-400 font-semibold ml-2">
                      Compiling to canvas...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-4" />
              ),
          }}
        />
      </div>

      {isDirty && diffPatches.length > 0 && onNavigateToCanvas && (
        <div className="lg:hidden px-3 pt-2 bg-white">
          <button
            type="button"
            onClick={onNavigateToCanvas}
            className="w-full py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-medium flex items-center justify-between shadow-2xs active:scale-[0.99] transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{diffPatches.length} changes pending</span>
            </span>
            <span className="text-[11px] font-bold text-amber-800">View in Canvas ➔</span>
          </button>
        </div>
      )}

      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 flex-shrink-0">
        <form onSubmit={onSendMessage} className="space-y-2">
          <div className="bg-slate-50 border border-slate-200 rounded-full flex items-center px-3.5 sm:px-4 py-2 gap-2 shadow-2xs focus-within:border-slate-400 focus-within:bg-white transition">
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
              onChange={(e) => setInputValue(e.target.value.slice(0, MAX_TENANT_INPUT_CHARS))}
              maxLength={MAX_TENANT_INPUT_CHARS}
              disabled={status === 'processing' || status === 'loading'}
              placeholder="Type your business rules..."
              className="flex-1 bg-transparent text-[13px] text-slate-900 placeholder-slate-400 outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={
                !inputValue.trim() ||
                inputValue.trim().length > MAX_TENANT_INPUT_CHARS ||
                status === 'processing' ||
                status === 'loading'
              }
              className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 transition cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
              title="Compile instruction"
            >
              <ArrowRight className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="truncate">Deterministic compiler: Synced with preview</span>
            </span>
            <div className="flex items-center gap-2 flex-shrink-0 font-mono">
              {inputValue.length > 0 && (
                <span
                  className={
                    inputValue.length >= MAX_TENANT_INPUT_CHARS
                      ? 'text-red-500 font-semibold'
                      : inputValue.length >= MAX_TENANT_INPUT_CHARS * 0.85
                        ? 'text-amber-500 font-semibold'
                        : 'text-slate-400'
                  }
                >
                  {inputValue.length.toLocaleString()}/{MAX_TENANT_INPUT_CHARS.toLocaleString()} (~
                  {Math.ceil(inputValue.length / 4).toLocaleString()}/5,000 tok)
                </span>
              )}
              <span className="hidden sm:inline">Press Return ↵</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
