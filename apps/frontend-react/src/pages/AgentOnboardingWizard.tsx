import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { axiosClient } from '../api/axiosClient';
import { Send, Bot, User, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Type definitions
interface Message {
  id: string;
  role: 'agent' | 'tenant';
  text: string;
}

export default function AgentOnboardingWizard() {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [draftSchema, setDraftSchema] = useState<any>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'awaiting_input' | 'processing' | 'complete'>('idle');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const tenantId = useAuthStore((state) => state.user?.tenant_id);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const startSession = async () => {
      if (!tenantId || !agentId) return;
      setStatus('loading');
      try {
        const res = await axiosClient.post('/api/v1/tenant/knowledge/onboarding/start', {
          tenant_id: tenantId,
          agent_id: agentId,
        });
        
        const data = res.data.data;
        setDraftSchema(data.draft_schema);
        
        if (data.status === 'complete') {
          setStatus('complete');
          setMessages([{ id: '1', role: 'agent', text: '✅ Configuration is already complete and live!' }]);
        } else {
          setStatus('awaiting_input');
          if (data.question) {
            setMessages([{ id: Date.now().toString(), role: 'agent', text: data.question }]);
          }
        }
      } catch (error) {
        console.error('Failed to start session', error);
        setMessages([{ id: 'err', role: 'agent', text: 'Sorry, I encountered an error starting the session.' }]);
        setStatus('awaiting_input');
      }
    };

    if (status === 'idle' && tenantId) {
      startSession();
    }
  }, [tenantId, status]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || status !== 'awaiting_input') return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tenant', text: userMsg }]);
    setStatus('processing');

    try {
      const res = await axiosClient.post('/api/v1/tenant/knowledge/onboarding/message', {
        tenant_id: tenantId,
        agent_id: agentId,
        user_answer: userMsg
      });
      
      const data = res.data.data;
      setDraftSchema(data.draft_schema);
      
      if (data.status === 'complete') {
        setStatus('complete');
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'agent', 
          text: '✅ Amazing! Your agent configuration is complete and saved to the database. You are ready to go live!' 
        }]);
      } else {
        setStatus('awaiting_input');
        if (data.question) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', text: data.question }]);
        }
      }
    } catch (error) {
      console.error('Failed to send message', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', text: 'Error connecting to the agent. Please try again.' }]);
      setStatus('awaiting_input');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800">
      
      {/* LEFT COLUMN - CHAT INTERFACE */}
      <div className="flex flex-col w-1/2 border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/tenant/agents")}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Back to AI Agents Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">AI Agent Setup Wizard</h1>
                <p className="font-mono text-[10px] text-slate-400 leading-none mt-0.5">{agentId}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {status === 'complete' ? (
              <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Live
              </span>
            ) : (
              <span className="flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Drafting
              </span>
            )}
            <button
              onClick={() => navigate(`/tenant/agents/${agentId}/dashboard`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-2xs transition active:scale-98 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center items-center h-full text-slate-400">
              <div className="animate-pulse flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Initializing setup agent...
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'tenant' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'tenant' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
                  ${msg.role === 'tenant' ? 'bg-indigo-100 ml-2' : 'bg-slate-100 mr-2'}`}>
                  {msg.role === 'tenant' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-slate-600" />}
                </div>
                
                <div className={`p-3 rounded-2xl shadow-sm
                  ${msg.role === 'tenant' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {status === 'processing' && (
            <div className="flex justify-start">
              <div className="flex flex-row max-w-[80%]">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 mr-2">
                  <Bot className="w-5 h-5 text-slate-600" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* CHAT INPUT */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={status !== 'awaiting_input'}
              placeholder={status === 'complete' ? "Configuration complete" : "Type your answer..."}
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 transition-all shadow-sm text-sm"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || status !== 'awaiting_input'}
              className="absolute right-2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

     
      <div className="flex flex-col w-1/2 bg-slate-900 text-slate-300 shadow-inner">
        <div className="p-4 border-b border-slate-700 bg-slate-900 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            Live Configuration State
          </h2>
          <span className="text-xs font-mono text-slate-500">agent_runtime_configs</span>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
            <code dangerouslySetInnerHTML={{
              __html: syntaxHighlight(JSON.stringify(draftSchema, null, 2))
            }} />
          </pre>
        </div>
      </div>
      
    </div>
  );
}


function syntaxHighlight(json: string) {
  if (!json) return '';
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-sky-400'; // number
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-pink-400'; // key
      } else {
        cls = 'text-emerald-300'; // string
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-orange-400'; // boolean
    } else if (/null/.test(match)) {
      cls = 'text-slate-500'; // null
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}
