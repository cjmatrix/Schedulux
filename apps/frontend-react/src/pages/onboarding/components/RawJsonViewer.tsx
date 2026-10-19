import React from 'react';
import { Check, Copy } from 'lucide-react';
import { syntaxHighlight } from '../utils';

interface RawJsonViewerProps {
  draftSchema: any;
  copiedJson: boolean;
  onCopyJson: () => void;
}

export const RawJsonViewer: React.FC<RawJsonViewerProps> = ({
  draftSchema,
  copiedJson,
  onCopyJson,
}) => {
  return (
    <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 shadow-xl flex flex-col h-[650px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-slate-100">
            agent_runtime_config (v2.4)
          </span>
        </div>
        <button
          type="button"
          onClick={onCopyJson}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer font-mono"
        >
          {copiedJson ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pt-4">
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
          <code
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(JSON.stringify(draftSchema, null, 2)),
            }}
          />
        </pre>
      </div>
    </div>
  );
};
