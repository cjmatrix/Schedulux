import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  type AgentSummaryInfo,
  type KnowledgeDocumentInfo,
  type SaveInitialAgentDraftRequest,
  type SaveInitialAgentDraftResponse,
  knowledgeApi,
} from '../../../api/knowledgeApi';

export const KNOWLEDGE_KEYS = {
  allAgents: ['tenant-agents'] as const,
  agentsList: ['tenant-agents-list'] as const,
  allDocuments: ['knowledge-documents'] as const,
  documents: (agentId?: string) => ['knowledge-documents', agentId] as const,
};

export function useTenantAgents() {
  return useQuery<AgentSummaryInfo[], Error>({
    queryKey: KNOWLEDGE_KEYS.agentsList,
    queryFn: async () => {
      const res = await knowledgeApi.listTenantAgents();
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ success: boolean; agent_id: string }>, Error, string>({
    mutationFn: async (agentId: string) => {
      return knowledgeApi.deleteAgent(agentId);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEYS.agentsList });
      toast.success(res.message || 'Agent deleted successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete agent');
    },
  });
}

export function useKnowledgeDocuments(agentId?: string) {
  return useQuery<KnowledgeDocumentInfo[], Error>({
    queryKey: KNOWLEDGE_KEYS.documents(agentId),
    queryFn: async () => {
      const res = await knowledgeApi.listDocuments(agentId || undefined);
      return res.data;
    },
    enabled: Boolean(agentId),
    refetchInterval: (query) => {
      const docs = query.state.data;
      const hasInFlight = docs?.some((d) =>
        ['pending', 'uploaded', 'indexing'].includes(d.status?.toLowerCase()),
      );
      return hasInFlight ? 3000 : false;
    },
    staleTime: 10 * 1000,
  });
}

export type UploadProgressStage =
  | 'idle'
  | 'presigning'
  | 'uploading'
  | 'confirming'
  | 'done'
  | 'error';

export interface UploadDocumentVariables {
  agentId: string;
  file: File;
  onProgress?: (percent: number) => void;
  onStageChange?: (stage: UploadProgressStage) => void;
}

export function useUploadDocument(activeAgentId?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ document_id: string; s3_key: string }, Error, UploadDocumentVariables>({
    mutationFn: async ({ agentId, file, onProgress, onStageChange }) => {
      onStageChange?.('presigning');
      onProgress?.(10);

      const presignedRes = await knowledgeApi.getDocumentUploadUrl({
        agent_id: agentId,
        file_name: file.name,
        file_size_bytes: file.size,
      });

      const { upload_url, document_id, s3_key } = presignedRes.data;

      onStageChange?.('uploading');
      await knowledgeApi.uploadFileToS3(upload_url, file, (pct) => {
        onProgress?.(15 + Math.round(pct * 0.75));
      });

      onStageChange?.('confirming');
      onProgress?.(95);
      await knowledgeApi.confirmDocumentUpload({ document_id });

      onStageChange?.('done');
      onProgress?.(100);

      return { document_id, s3_key };
    },
    onSuccess: (_, variables) => {
      const targetAgentId = variables.agentId || activeAgentId;
      if (targetAgentId) {
        queryClient.invalidateQueries({
          queryKey: KNOWLEDGE_KEYS.documents(targetAgentId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: KNOWLEDGE_KEYS.allDocuments,
      });
    },
  });
}

export function useDeleteDocument(activeAgentId?: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ success: boolean }>, Error, string>({
    mutationFn: (documentId: string) => knowledgeApi.deleteDocument(documentId),
    onSuccess: () => {
      if (activeAgentId) {
        queryClient.invalidateQueries({
          queryKey: KNOWLEDGE_KEYS.documents(activeAgentId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: KNOWLEDGE_KEYS.allDocuments,
      });
    },
  });
}

export function useSaveInitialAgentDraft() {
  const queryClient = useQueryClient();

  return useMutation<SaveInitialAgentDraftResponse, Error, SaveInitialAgentDraftRequest>({
    mutationFn: async (payload) => {
      const res = await knowledgeApi.saveInitialAgentDraft(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: KNOWLEDGE_KEYS.agentsList,
      });
      queryClient.invalidateQueries({
        queryKey: KNOWLEDGE_KEYS.allAgents,
      });
    },
  });
}
