import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { compare, type Operation } from 'fast-json-patch';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { onboardingApi, type RawAgentMessage } from '../api/onboardingApi.js';
import type { AgentDraftSchema, Message } from '../pages/onboarding/types.js';
import { cleanForDiff } from '../pages/onboarding/utils.js';
import { useAuthStore } from '../store/useAuthStore.js';

export type OnboardingWizardStatus = 'idle' | 'loading' | 'awaiting_input' | 'processing';

export interface UseAgentOnboardingOptions {
  agentId?: string;
  tenantId?: string;
}

export interface MessagesPage {
  messages: Message[];
  next_cursor: string | null;
  has_more: boolean;
}

const START_INDEX = 50000;

export function useAgentOnboarding({
  agentId,
  tenantId: customTenantId,
}: UseAgentOnboardingOptions) {
  const storeTenantId = useAuthStore((state) => state.user?.tenant_id);
  const tenantId = customTenantId || storeTenantId;
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');
  const [draftSchema, setDraftSchema] = useState<AgentDraftSchema>({});
  const [baselineSchema, setBaselineSchema] = useState<AgentDraftSchema | null>(null);
  const [status, setStatus] = useState<OnboardingWizardStatus>('idle');
  const [isLive, setIsLive] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
  const pagesCountRef = useRef(1);

  const [sandboxMessages, setSandboxMessages] = useState<
    Array<{ role: 'user' | 'agent'; text: string }>
  >([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSandboxTyping, setIsSandboxTyping] = useState(false);
  const [sandboxSessionId, setSandboxSessionId] = useState<string>(() => `sandbox_${Date.now()}`);

  const hasStartedRef = useRef(false);
  const currentAgentIdRef = useRef<string | null>(null);

  const queryKey = useMemo(() => ['agent-messages', tenantId, agentId], [tenantId, agentId]);

  const {
    data,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isLoading: isLoadingMessages,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam?: string }): Promise<MessagesPage> => {
      if (!agentId) {
        return { messages: [], next_cursor: null, has_more: false };
      }
      const res = await onboardingApi.getAgentMessages(agentId, {
        limit: 20,
        before: pageParam,
      });
      const rawMsgs = res.data?.messages || [];
      return {
        messages: rawMsgs.map((m: RawAgentMessage) => ({
          id: m.message_id || m.id || String(Math.random()),
          role: (m.role === 'tenant' ? 'tenant' : 'agent') as 'tenant' | 'agent',
          text: m.content || m.text || '',
        })),
        next_cursor: res.data?.next_cursor || null,
        has_more: Boolean(res.data?.has_more),
      };
    },
    initialPageParam: undefined,
    getPreviousPageParam: (firstPage) => {
      return firstPage.has_more && firstPage.next_cursor ? firstPage.next_cursor : undefined;
    },
    getNextPageParam: () => undefined,
    enabled: Boolean(tenantId && agentId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.messages);
  }, [data?.pages]);

  useEffect(() => {
    if (!data?.pages) return;
    const currentPagesCount = data.pages.length;
    if (currentPagesCount > pagesCountRef.current) {
      const prependedCount = data.pages[0]?.messages?.length ?? 0;
      setFirstItemIndex((prev) => prev - prependedCount);
      pagesCountRef.current = currentPagesCount;
    }
  }, [data?.pages]);

  useEffect(() => {
    if (!tenantId || !agentId) return;

    if (currentAgentIdRef.current !== agentId) {
      currentAgentIdRef.current = agentId;
      hasStartedRef.current = false;
      pagesCountRef.current = 1;
      setFirstItemIndex(START_INDEX);
      setDraftSchema({});
      setBaselineSchema(null);
      setIsLive(false);
      setSandboxMessages([]);
    }

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startSession = async () => {
      setStatus('loading');
      try {
        const res = await onboardingApi.startSession({
          tenant_id: tenantId,
          agent_id: agentId,
        });

        const resData = res.data;
        if (resData?.draft_schema) {
          setDraftSchema(resData.draft_schema);

          const hasLive = Boolean(
            resData.live_schema &&
              typeof resData.live_schema === 'object' &&
              Object.keys(resData.live_schema).length > 0 &&
              (resData.live_schema.business_profile || resData.live_schema.schema_version),
          );

          if (hasLive) {
            setBaselineSchema(resData.live_schema ?? null);
            setIsLive(true);
          } else {
            setBaselineSchema(resData.draft_schema);
          }
        }

        const isCompleted =
          resData.status === 'complete' ||
          resData.draft_schema?.status === 'complete' ||
          resData.draft_schema?.status === 'created';

        if (isCompleted) {
          setIsLive(true);
        }

        if (resData.question) {
          queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(
            queryKey,
            (old) => {
              const count = old?.pages.reduce((acc, p) => acc + p.messages.length, 0) ?? 0;
              if (count === 0) {
                return {
                  pages: [
                    {
                      messages: [
                        {
                          id: 'agent-welcome-' + Date.now(),
                          role: 'agent',
                          text:
                            resData.question || 'Welcome to your AI Scheduling Agent onboarding!',
                        },
                      ],
                      next_cursor: null,
                      has_more: false,
                    },
                  ],
                  pageParams: [undefined],
                };
              }
              return old;
            },
          );
        }

        setStatus('awaiting_input');
      } catch (err) {
        console.error('Failed to start onboarding session:', err);
        setStatus('idle');
      }
    };

    startSession();
  }, [tenantId, agentId, queryKey, queryClient]);

  const diffPatches: Operation[] = useMemo(() => {
    if (!baselineSchema || !draftSchema) return [];
    try {
      const cleanedBaseline = cleanForDiff(baselineSchema) || {};
      const cleanedDraft = cleanForDiff(draftSchema) || {};
      return compare(cleanedBaseline, cleanedDraft);
    } catch (err) {
      console.error('Error computing schema diffs:', err);
      return [];
    }
  }, [baselineSchema, draftSchema]);

  const isDirty = diffPatches.length > 0;

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const userMsg = (textToSend ?? inputValue).trim();
      if (!userMsg || status === 'processing' || status === 'loading' || !tenantId || !agentId) {
        return;
      }

      setInputValue('');
      setStatus('processing');

      const tempId = 'temp-' + Date.now();
      const optimisticMessage: Message = {
        id: tempId,
        role: 'tenant',
        text: userMsg,
      };

      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(queryKey, (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pages: [{ messages: [optimisticMessage], next_cursor: null, has_more: false }],
            pageParams: [undefined],
          };
        }
        const lastIdx = old.pages.length - 1;
        const updatedPages = [...old.pages];
        updatedPages[lastIdx] = {
          ...old.pages[lastIdx],
          messages: [...old.pages[lastIdx].messages, optimisticMessage],
        };
        return {
          ...old,
          pages: updatedPages,
        };
      });

      try {
        const res = await onboardingApi.sendMessage({
          tenant_id: tenantId,
          agent_id: agentId,
          user_answer: userMsg,
        });

        const resData = res.data;
        if (resData?.draft_schema) {
          setDraftSchema(resData.draft_schema);
        }

        const isCompleted =
          resData.status === 'complete' ||
          resData.draft_schema?.status === 'complete' ||
          resData.draft_schema?.status === 'created';

        if (isCompleted) {
          setIsLive(true);
          if (resData.draft_schema) {
            setBaselineSchema(resData.draft_schema);
          }
        }

        const agentReplyText =
          resData.question ||
          (isCompleted
            ? 'Your agent configuration is complete and saved to the database. You are ready to go live!'
            : '');

        if (agentReplyText) {
          const agentReply: Message = {
            id: 'agent-' + Date.now(),
            role: 'agent',
            text: agentReplyText,
          };
          queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(
            queryKey,
            (old) => {
              if (!old || old.pages.length === 0) return old;
              const lastIdx = old.pages.length - 1;
              const updatedPages = [...old.pages];
              updatedPages[lastIdx] = {
                ...old.pages[lastIdx],
                messages: [...old.pages[lastIdx].messages, agentReply],
              };
              return {
                ...old,
                pages: updatedPages,
              };
            },
          );
        }

        setStatus('awaiting_input');
      } catch (err) {
        console.error('Failed to send message:', err);
        setStatus('awaiting_input');

        const errorMessage: Message = {
          id: 'err-' + Date.now(),
          role: 'agent',
          text: 'Encountered an issue compiling changes to the draft canvas. Please rephrase or try again.',
        };
        queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(
          queryKey,
          (old) => {
            if (!old || old.pages.length === 0) return old;
            const lastIdx = old.pages.length - 1;
            const updatedPages = [...old.pages];
            updatedPages[lastIdx] = {
              ...old.pages[lastIdx],
              messages: [...old.pages[lastIdx].messages, errorMessage],
            };
            return {
              ...old,
              pages: updatedPages,
            };
          },
        );
      }
    },
    [inputValue, status, tenantId, agentId, queryKey, queryClient],
  );

  const saveChanges = useCallback(async () => {
    if (!tenantId || !agentId || isSavingChanges) return;
    setIsSavingChanges(true);

    const publishMsgText = 'deploy live now and finalize configuration';
    const tempId = 'temp-' + Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      role: 'tenant',
      text: publishMsgText,
    };

    await queryClient.cancelQueries({ queryKey });

    queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(queryKey, (old) => {
      if (!old || old.pages.length === 0) {
        return {
          pages: [{ messages: [optimisticMessage], next_cursor: null, has_more: false }],
          pageParams: [undefined],
        };
      }
      const lastIdx = old.pages.length - 1;
      const updatedPages = [...old.pages];
      updatedPages[lastIdx] = {
        ...old.pages[lastIdx],
        messages: [...old.pages[lastIdx].messages, optimisticMessage],
      };
      return {
        ...old,
        pages: updatedPages,
      };
    });

    try {
      const res = await onboardingApi.sendMessage({
        tenant_id: tenantId,
        agent_id: agentId,
        user_answer: publishMsgText,
      });

      const resData = res.data;
      if (resData?.draft_schema) {
        setDraftSchema(resData.draft_schema);
      }

      const isCompleted =
        resData.status === 'complete' ||
        resData.draft_schema?.status === 'complete' ||
        resData.draft_schema?.status === 'created';

      if (isCompleted) {
        setIsLive(true);
        if (resData.draft_schema) {
          setBaselineSchema(resData.draft_schema);
        }
      }

      const agentReplyText =
        resData.question ||
        (isCompleted
          ? 'Your agent configuration is complete and saved to the database. You are ready to go live!'
          : '');

      if (agentReplyText) {
        const agentReply: Message = {
          id: 'agent-' + Date.now(),
          role: 'agent',
          text: agentReplyText,
        };
        queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(
          queryKey,
          (old) => {
            if (!old || old.pages.length === 0) return old;
            const lastIdx = old.pages.length - 1;
            const updatedPages = [...old.pages];
            updatedPages[lastIdx] = {
              ...old.pages[lastIdx],
              messages: [...old.pages[lastIdx].messages, agentReply],
            };
            return {
              ...old,
              pages: updatedPages,
            };
          },
        );
      }

      const sessionRes = await onboardingApi.startSession({
        tenant_id: tenantId,
        agent_id: agentId,
      });

      const sessionData = sessionRes.data;
      if (sessionData?.draft_schema) {
        setDraftSchema(sessionData.draft_schema);
        const hasLive = Boolean(
          sessionData.live_schema &&
            typeof sessionData.live_schema === 'object' &&
            Object.keys(sessionData.live_schema).length > 0 &&
            (sessionData.live_schema.business_profile || sessionData.live_schema.schema_version),
        );
        setBaselineSchema(hasLive ? (sessionData.live_schema ?? null) : sessionData.draft_schema);
        setIsLive(true);
      }
    } catch (err) {
      console.error('Failed to publish agent configuration:', err);
      const errorMessage: Message = {
        id: 'err-' + Date.now(),
        role: 'agent',
        text: 'Encountered an issue compiling changes to the draft canvas. Please rephrase or try again.',
      };
      queryClient.setQueryData<InfiniteData<MessagesPage, string | undefined>>(queryKey, (old) => {
        if (!old || old.pages.length === 0) return old;
        const lastIdx = old.pages.length - 1;
        const updatedPages = [...old.pages];
        updatedPages[lastIdx] = {
          ...old.pages[lastIdx],
          messages: [...old.pages[lastIdx].messages, errorMessage],
        };
        return {
          ...old,
          pages: updatedPages,
        };
      });
    } finally {
      setIsSavingChanges(false);
    }
  }, [tenantId, agentId, isSavingChanges, queryKey, queryClient]);

  const sendSandboxMessage = useCallback(
    async (e?: React.FormEvent, clinicName = 'AI Scheduling Agent') => {
      if (e) e.preventDefault();
      const userText = sandboxInput.trim();
      if (!userText || isSandboxTyping) return;

      setSandboxInput('');
      setSandboxMessages((prev) => [...prev, { role: 'user', text: userText }]);
      setIsSandboxTyping(true);

      try {
        const res = await onboardingApi.sendSandboxMessage({
          tenant_id: tenantId,
          agent_id: agentId,
          session_id: sandboxSessionId,
          message: userText,
        });

        const reply =
          res.data?.reply ||
          `I would be happy to help you with that at ${clinicName}!`;

        setSandboxMessages((prev) => [...prev, { role: 'agent', text: reply }]);
      } catch (err) {
        console.error('Failed to send sandbox message:', err);
        setSandboxMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            text: `I apologize, I encountered an issue connecting to the AI agent runtime. Please verify the agent draft or try again.`,
          },
        ]);
      } finally {
        setIsSandboxTyping(false);
      }
    },
    [sandboxInput, isSandboxTyping, tenantId, agentId, sandboxSessionId],
  );

  const resetSandbox = useCallback((greeting?: string) => {
    setSandboxSessionId(`sandbox_${Date.now()}`);
    setSandboxMessages([
      {
        role: 'agent',
        text:
          greeting ||
          `Hello! I'm your AI booking coordinator. How can I assist you with scheduling or consultations today?`,
      },
    ]);
    setSandboxInput('');
  }, []);

  return {
    messages,
    isLoadingMessages,
    hasPreviousPage: Boolean(hasPreviousPage),
    isFetchingPreviousPage,
    fetchPreviousPage,
    firstItemIndex,
    inputValue,
    setInputValue,
    status,
    sendMessage,

    draftSchema,
    baselineSchema,
    setDraftSchema,
    setBaselineSchema,
    diffPatches,
    isDirty,
    isLive,
    setIsLive,
    isSavingChanges,
    saveChanges,

    sandboxMessages,
    setSandboxMessages,
    sandboxInput,
    setSandboxInput,
    isSandboxTyping,
    sendSandboxMessage,
    resetSandbox,
    sandboxSessionId,

    refetchMessages: () => queryClient.invalidateQueries({ queryKey }),
  };
}
