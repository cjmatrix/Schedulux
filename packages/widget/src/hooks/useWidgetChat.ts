import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import {
  clearStoredSession,
  type FetchChatMessagesResult,
  fetchChatMessages,
  fetchInitChat,
  loadStoredSession,
  postChatMessage,
} from '../api';
import type { WidgetChatMessage, WidgetConfig, WidgetInitOptions } from '../types';

export const WIDGET_CHAT_KEYS = {
  all: ['schedulux-widget'] as const,
  messages: (mode: string, tenantId: string, agentId: string, sessionId?: string) =>
    [...WIDGET_CHAT_KEYS.all, 'messages', mode, tenantId, agentId, sessionId ?? ''] as const,
};

interface UseWidgetChatOptions {
  options: WidgetInitOptions;
  config: Partial<WidgetConfig>;
}

export function useWidgetChat({ options, config }: UseWidgetChatOptions) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string>(() => {
    return loadStoredSession(options.tenantId, options.agentId)?.sessionId || '';
  });
  const [token, setToken] = useState<string | undefined>(() => {
    return loadStoredSession(options.tenantId, options.agentId)?.token;
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const greeting =
    config.initial_greeting || 'Hi there! How can I assist you with scheduling today?';

  const mode = options.mode || 'live';
  const queryKey = useMemo(
    () => WIDGET_CHAT_KEYS.messages(mode, options.tenantId, options.agentId, sessionId),
    [mode, options.tenantId, options.agentId, sessionId],
  );

  // 1. Session initialization
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      setIsInitializing(true);
      try {
        const res = await fetchInitChat(
          options.apiBase || '',
          options.tenantId,
          options.agentId,
          mode,
        );
        if (!isCancelled) {
          setSessionId(res.sessionId);
          setToken(res.token);
        }
      } catch (err) {
        console.warn('[Schedulux Widget] Session init fallback:', err);
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    void init();

    return () => {
      isCancelled = true;
    };
  }, [options.apiBase, options.tenantId, options.agentId, mode]);

  // 2. Cursor-based Infinite Messages Query
  const {
    data,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isLoading: isLoadingMessages,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam?: string }): Promise<FetchChatMessagesResult> => {
      if (!sessionId) {
        return { messages: [], next_cursor: null, has_more: false };
      }
      return fetchChatMessages({
        apiBase: options.apiBase || '',
        tenantId: options.tenantId,
        agentId: options.agentId,
        sessionId,
        token,
        before: pageParam,
        limit: 20,
        mode,
      });
    },
    initialPageParam: undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.has_more && firstPage.next_cursor ? firstPage.next_cursor : undefined,
    getNextPageParam: () => undefined,
    enabled: Boolean(sessionId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });


  const messages = useMemo<WidgetChatMessage[]>(() => {
    const rawMessages = data?.pages ? data.pages.flatMap((page) => page.messages) : [];

    if (rawMessages.length === 0) {
      return [
        {
          id: 'welcome',
          role: 'agent',
          content: greeting,
          created_at: new Date().toISOString(),
        },
      ];
    }

  
    const seenIds = new Set<string>();
    const deduplicated: WidgetChatMessage[] = [];
    for (const msg of rawMessages) {
      if (msg.id) {
        if (seenIds.has(msg.id)) continue;
        seenIds.add(msg.id);
      }
      deduplicated.push(msg);
    }
    return deduplicated;
  }, [data?.pages, greeting]);


  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (options.onSendMessage) {
        const res = await options.onSendMessage(text);
        return {
          response: res.response,
          sessionId,
          token,
          booking_id: res.booking_id,
          booking_reference: res.booking_reference,
          status: res.status,
        };
      }

      return postChatMessage(
        options.apiBase || '',
        options.tenantId,
        options.agentId,
        sessionId,
        token,
        text,
        options.customerName,
        options.customerPhone,
        mode,
      );
    },
    onMutate: async (text: string) => {
      setIsTyping(true);
      const tempId = `temp_${Date.now()}`;
      const userMsg: WidgetChatMessage = {
        id: tempId,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
        delivery_status: 'pending',
      };

      // Optimistically append user message to the latest page
      queryClient.setQueryData<InfiniteData<FetchChatMessagesResult>>(queryKey, (oldData) => {
        if (!oldData || oldData.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [
              {
                messages: [userMsg],
                next_cursor: null,
                has_more: false,
              },
            ],
          };
        }
        const lastIndex = oldData.pages.length - 1;
        const updatedLastPage = {
          ...oldData.pages[lastIndex],
          messages: [...oldData.pages[lastIndex].messages, userMsg],
        };
        const updatedPages = [...oldData.pages];
        updatedPages[lastIndex] = updatedLastPage;
        return {
          ...oldData,
          pages: updatedPages,
        };
      });

      return { tempId };
    },
    onSuccess: (res, _text, context) => {
      const isNewSession = Boolean(res.sessionId && res.sessionId !== sessionId);
      if (isNewSession && res.sessionId) {
        setSessionId(res.sessionId);
      }
      if (res.token) {
        setToken(res.token);
      }

      const agentReply = res.response || 'I would be happy to help you with that!';

      const agentMsg: WidgetChatMessage = {
        id: res.agent_message_id || `agent_${Date.now()}`,
        role: 'agent',
        content: agentReply,
        created_at: res.created_at || new Date().toISOString(),
        booking_id: res.booking_id,
        booking_reference: res.booking_reference,
        status: res.status,
        delivery_status: 'sent',
      };

      const reconcileMessages = (oldData: InfiniteData<FetchChatMessagesResult> | undefined) => {
        if (!oldData || oldData.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [
              {
                messages: [agentMsg],
                next_cursor: null,
                has_more: false,
              },
            ],
          };
        }
        const lastIndex = oldData.pages.length - 1;
        const lastPage = oldData.pages[lastIndex];

        // 1. Swap tempId with the real user_message_id and mark sent
        const reconciledMessages = lastPage.messages.map((m) => {
          if (context?.tempId && m.id === context.tempId) {
            return {
              ...m,
              id: res.user_message_id || m.id,
              delivery_status: 'sent' as const,
            };
          }
          return m;
        });

        // 2. Append agentMsg (with deduplication)
        const isDuplicate = reconciledMessages.some(
          (m) =>
            m.id === agentMsg.id ||
            (m.role === 'agent' &&
              m.content === agentMsg.content &&
              Math.abs(
                new Date(m.created_at || 0).getTime() -
                  new Date(agentMsg.created_at || 0).getTime(),
              ) < 3000),
        );
        if (!isDuplicate) {
          reconciledMessages.push(agentMsg);
        }

        const updatedLastPage = {
          ...lastPage,
          messages: reconciledMessages,
        };
        const updatedPages = [...oldData.pages];
        updatedPages[lastIndex] = updatedLastPage;
        return {
          ...oldData,
          pages: updatedPages,
        };
      };

      if (isNewSession && res.sessionId) {
        const targetKey = WIDGET_CHAT_KEYS.messages(
          mode,
          options.tenantId,
          options.agentId,
          res.sessionId,
        );
        const currentData = queryClient.getQueryData<InfiniteData<FetchChatMessagesResult>>(queryKey);
        queryClient.setQueryData<InfiniteData<FetchChatMessagesResult>>(
          targetKey,
          reconcileMessages(currentData),
        );
      } else {
        queryClient.setQueryData<InfiniteData<FetchChatMessagesResult>>(queryKey, reconcileMessages);
      }

      if (res.booking_reference) {
        options.onBookingConfirmed?.({
          booking_id: res.booking_id,
          booking_reference: res.booking_reference,
          status: res.status,
        });
      }
    },
    onError: (err, _text, context) => {
      console.error('[Schedulux Widget] Message error:', err);

      // Mark the optimistic message as error
      queryClient.setQueryData<InfiniteData<FetchChatMessagesResult>>(queryKey, (oldData) => {
        if (!oldData || oldData.pages.length === 0) return oldData;
        const lastIndex = oldData.pages.length - 1;
        const lastPage = oldData.pages[lastIndex];
        const updatedMessages = lastPage.messages.map((m) =>
          context?.tempId && m.id === context.tempId
            ? { ...m, delivery_status: 'error' as const }
            : m,
        );
        const updatedPages = [...oldData.pages];
        updatedPages[lastIndex] = { ...lastPage, messages: updatedMessages };
        return { ...oldData, pages: updatedPages };
      });

      const fallbackText =
        config.fallback_message ||
        'I apologize, but I am having trouble connecting to the booking server. Please try again shortly or contact support.';
      const errMsg: WidgetChatMessage = {
        id: `err_${Date.now()}`,
        role: 'agent',
        content: fallbackText,
        created_at: new Date().toISOString(),
        delivery_status: 'error',
      };
      queryClient.setQueryData<InfiniteData<FetchChatMessagesResult>>(queryKey, (oldData) => {
        if (!oldData || oldData.pages.length === 0) return oldData;
        const lastIndex = oldData.pages.length - 1;
        const updatedLastPage = {
          ...oldData.pages[lastIndex],
          messages: [...oldData.pages[lastIndex].messages, errMsg],
        };
        const updatedPages = [...oldData.pages];
        updatedPages[lastIndex] = updatedLastPage;
        return {
          ...oldData,
          pages: updatedPages,
        };
      });
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping || !sessionId) return;
      await sendMessageMutation.mutateAsync(text.trim());
    },
    [isTyping, sessionId, sendMessageMutation],
  );

  const resetSession = useCallback(async () => {
    clearStoredSession(options.tenantId, options.agentId);
    queryClient.removeQueries({ queryKey });
    setSessionId('');
    setToken(undefined);
    setIsInitializing(true);
    try {
      const res = await fetchInitChat(
        options.apiBase || '',
        options.tenantId,
        options.agentId,
        mode,
      );
      setSessionId(res.sessionId);
      setToken(res.token);
    } finally {
      setIsInitializing(false);
    }
    options.onReset?.();
  }, [
    options.tenantId,
    options.agentId,
    options.apiBase,
    mode,
    queryClient,
    queryKey,
    options.onReset,
  ]);

  return {
    messages,
    isTyping,
    isLoadingMessages,
    isInitializing,
    hasOlderMessages: Boolean(hasPreviousPage),
    isFetchingOlderMessages: isFetchingPreviousPage,
    loadOlderMessages: fetchPreviousPage,
    sendMessage,
    resetSession,
  };
}
