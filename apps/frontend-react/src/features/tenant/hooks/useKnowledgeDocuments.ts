import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  type AgentSummaryInfo,
  type KnowledgeDocumentInfo,
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

export function useKnowledgeDocuments(agentId?: string) {
  return useQuery<KnowledgeDocumentInfo[], Error>({
    queryKey: KNOWLEDGE_KEYS.documents(agentId),
    queryFn: async () => {
      const res = await knowledgeApi.listDocuments(agentId || undefined);
      return res.data;
    },
    enabled: Boolean(agentId),
    staleTime: 30 * 1000,
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
