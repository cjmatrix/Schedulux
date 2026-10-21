import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { knowledgeApi } from '../api/knowledgeApi.js';
import type { AgentDraftSchema } from '../pages/onboarding/types.js';
import { useAuthStore } from '../store/useAuthStore.js';

export type GenerationStage = 'idle' | 'crawling' | 'generating' | 'completed' | 'error';

export interface UseAgentSchemaGenerationReturn {
  startCrawl: (url: string) => void;
  isLoading: boolean;
  stage: GenerationStage;
  progressMessage: string;
  jobId: string | null;
  schema: AgentDraftSchema | null;
  error: string | null;
  reset: () => void;
}

export function useAgentSchemaGeneration(): UseAgentSchemaGenerationReturn {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenant_id || 'tenant_preview_01';

  const [jobId, setJobId] = useState<string | null>(null);
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [schema, setSchema] = useState<AgentDraftSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const tenantIdRef = useRef<string>(tenantId);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    jobIdRef.current = jobId;
  }, [jobId]);
  useEffect(() => {
    tenantIdRef.current = tenantId;
  }, [tenantId]);

  const applySchema = useCallback((receivedSchema: AgentDraftSchema) => {
    setSchema(receivedSchema);
    setStage('completed');
    setProgressMessage('Agent schema successfully generated!');

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Stable socket connection — only recreated when tenantId changes
  useEffect(() => {
    const gatewayUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(gatewayUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to Schedulux Gateway:', socket.id);

      socket.emit('join:tenant', { tenant_id: tenantIdRef.current });

      if (jobIdRef.current) {
        socket.emit('join:job', { job_id: jobIdRef.current });
      }
    });

    socket.on('schema:ready', (payload: { schema?: AgentDraftSchema }) => {
      console.log('[WebSocket] Received schema:ready notification:', payload);
      if (payload?.schema) {
        applySchema(payload.schema);
      }
    });

    socket.on('schema:failed', (payload: { error?: string }) => {
      console.warn('[WebSocket] Received schema:failed notification:', payload);
      setError(payload?.error || 'Failed to generate agent schema');
      setStage('error');
      setProgressMessage('');
      setSchema(null);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[WebSocket] Connection warning:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId, applySchema]);

  // Polling fallback — activates when stage is 'generating', polls every 3s
  // Stops when schema arrives via WebSocket (applySchema) or polling succeeds
  useEffect(() => {
    if (stage !== 'generating' || !jobId) return;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const startDelay = setTimeout(() => {
      console.log(
        '[Polling] WebSocket may have missed schema:ready — starting REST polling fallback',
      );
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await knowledgeApi.getDraftSchema(
            tenantIdRef.current,
            jobIdRef.current ?? undefined,
          );
          if (res?.data?.status === 'completed' && res?.data?.schema) {
            console.log('[Polling] Schema found via REST fallback');
            applySchema(res.data.schema);
          }
        } catch (e) {
          console.warn('[Polling] Fallback poll error:', e);
        }
      }, 3000);
    }, 5000);

    return () => {
      clearTimeout(startDelay);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [stage, jobId, applySchema]);

  const crawlMutation = useMutation({
    mutationFn: (targetUrl: string) =>
      knowledgeApi.crawlSite({
        tenant_id: tenantId,
        url: targetUrl,
      }),
    onMutate: () => {
      setError(null);
      setSchema(null);
      setStage('crawling');
      setProgressMessage('Crawling website pages and extracting knowledge...');
    },
    onSuccess: (response) => {
      const newJobId = response.data?.job_id;
      if (newJobId) {
        setJobId(newJobId);
        jobIdRef.current = newJobId;
        setProgressMessage('Website crawled! Analyzing services & compiling schema with AI...');
        setStage('generating');

        socketRef.current?.emit('join:job', { job_id: newJobId });
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to start website crawl';
      setError(msg);
      setStage('error');
      setProgressMessage('');
    },
  });

  const startCrawl = useCallback(
    (url: string) => {
      if (!url?.trim()) {
        setError('Please enter a valid website URL');
        return;
      }
      crawlMutation.mutate(url.trim());
    },
    [crawlMutation],
  );

  const reset = useCallback(() => {
    setJobId(null);
    jobIdRef.current = null;
    setStage('idle');
    setProgressMessage('');
    setSchema(null);
    setError(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    startCrawl,
    isLoading: stage === 'crawling' || stage === 'generating',
    stage,
    progressMessage,
    jobId,
    schema,
    error,
    reset,
  };
}
