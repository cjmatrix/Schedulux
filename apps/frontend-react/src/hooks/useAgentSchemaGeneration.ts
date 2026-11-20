import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
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

  const applySchema = useCallback((receivedSchema: AgentDraftSchema) => {
    setSchema(receivedSchema);
    setStage('completed');
    setProgressMessage('Agent schema successfully generated!');
  }, []);

  useEffect(() => {
    if (stage !== 'generating' || !jobId) return;

    const gatewayUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const streamUrl = `${gatewayUrl}/api/v1/tenant/knowledge/schema/stream?job_id=${encodeURIComponent(jobId)}`;

    const eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });

    eventSource.addEventListener('schema:ready', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.schema) {
          applySchema(payload.schema);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse schema:ready event payload:', err);
      } finally {
        eventSource.close();
      }
    });

    eventSource.addEventListener('schema:failed', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        setError(payload?.error || 'Failed to generate agent schema');
        setStage('error');
        setProgressMessage('');
        setSchema(null);
      } catch (err) {
        console.error('[SSE] Failed to parse schema:failed event payload:', err);
      } finally {
        eventSource.close();
      }
    });

    eventSource.onerror = (err) => {
      console.warn('[SSE] EventSource connection notice:', err);
    };

    return () => {
      eventSource.close();
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
        setProgressMessage('Website crawled! Analyzing services & compiling schema with AI...');
        setStage('generating');
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
    setStage('idle');
    setProgressMessage('');
    setSchema(null);
    setError(null);
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
