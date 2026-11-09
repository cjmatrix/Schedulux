import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  FileText,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { KnowledgeDocumentInfo } from '../../../api/knowledgeApi';
import {
  useDeleteDocument,
  useKnowledgeDocuments,
  useTenantAgents,
  useUploadDocument,
} from '../hooks/useKnowledgeDocuments';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MIN_FILE_SIZE_BYTES = 100;
export const MAX_FILE_NAME_LENGTH = 200;

async function verifyPdfMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d // -
    );
  } catch {
    return false;
  }
}

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();

  const { data: agents = [] } = useTenantAgents();

  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    routeAgentId || agents[0]?.agent_id || '',
  );

  const activeAgentId = routeAgentId || selectedAgentId || agents[0]?.agent_id || '';
  const currentAgent = agents.find((a) => a.agent_id === activeAgentId);

  const {
    data: documents = [],
    isLoading: docsLoading,
    refetch: refetchDocs,
    isRefetching,
  } = useKnowledgeDocuments(activeAgentId);

  const uploadMutation = useUploadDocument(activeAgentId);
  const deleteMutation = useDeleteDocument(activeAgentId);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<
    'idle' | 'presigning' | 'uploading' | 'confirming' | 'done' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await validateAndSetFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setUploadStage('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSetFile = async (file: File) => {
    setErrorMessage(null);

    if (!file.name || !/\.pdf$/i.test(file.name)) {
      setErrorMessage('Only PDF documents (.pdf) are supported for Knowledge Base.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.name.length > MAX_FILE_NAME_LENGTH) {
      setErrorMessage(
        `File name is too long (${file.name.length} chars). Please keep it under ${MAX_FILE_NAME_LENGTH} characters.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.type && file.type !== 'application/pdf' && file.type !== 'application/x-pdf') {
      setErrorMessage('Invalid MIME type. Selected file is not a valid PDF document.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size < MIN_FILE_SIZE_BYTES) {
      setErrorMessage(
        'The selected file is empty (0 bytes) or corrupted. Please choose a valid PDF.',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `File size (${actualSizeMb} MB) exceeds the 25 MB industry standard limit. Please compress or split the document.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isValidPdfHeader = await verifyPdfMagicBytes(file);
    if (!isValidPdfHeader) {
      setErrorMessage(
        'Invalid PDF format: File header does not start with "%PDF-". The file may be corrupted or a renamed non-PDF file.',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setUploadStage('idle');
    setUploadProgress(0);
  };

  const executeUpload = async () => {
    if (!selectedFile || !activeAgentId) {
      setErrorMessage('Please select a file and ensure an active agent is chosen.');
      return;
    }

    try {
      setErrorMessage(null);
      await uploadMutation.mutateAsync({
        agentId: activeAgentId,
        file: selectedFile,
        onProgress: (pct) => setUploadProgress(pct),
        onStageChange: (stage) => setUploadStage(stage),
      });

      setTimeout(() => {
        clearSelectedFile();
      }, 2000);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setUploadStage('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to upload PDF. Please check S3 credentials and try again.',
      );
    }
  };

  const handleDelete = (doc: KnowledgeDocumentInfo) => {
    if (confirm(`Are you sure you want to delete "${doc.file_name}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredDocs = documents.filter((d) =>
    d.file_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <button
          onClick={() => navigate('/tenant/agents')}
          className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          AI Agents
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        {currentAgent && (
          <>
            <button
              onClick={() => navigate(`/tenant/agents/${activeAgentId}/dashboard`)}
              className="text-slate-600 hover:text-slate-800 font-bold truncate max-w-xs cursor-pointer"
            >
              {currentAgent.name}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </>
        )}
        <span className="text-slate-900 font-bold">Knowledge Base</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 flex items-center justify-center shadow-md shrink-0">
            <BookOpen className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Knowledge Base & FAQ PDFs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload PDF documents (pricing matrices, FAQ sheets, policy guides) to train your AI
              agent.
            </p>
          </div>
        </div>

        {/* Bucket badge & Agent selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-mono text-slate-600">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>s3://my-client-pdf-uploads-mumbai</span>
          </div>

          {agents.length > 1 && (
            <select
              value={activeAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                if (routeAgentId) {
                  navigate(`/tenant/agents/${e.target.value}/knowledge`);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none"
            >
              {agents.map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Upload Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload PDF Document</h2>
            <p className="text-xs text-slate-500">
              Files are securely uploaded directly to AWS S3 via short-lived presigned URLs.
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Max size: 25 MB</span>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
              : selectedFile
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag and drop your PDF here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 hover:text-indigo-700 underline font-bold cursor-pointer"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF format (.pdf) up to 25 MB
                </p>
              </div>
            </>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl w-full shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatFileSize(selectedFile.size)} · PDF Document
                  </p>
                </div>
                {uploadStage === 'idle' && (
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadStage !== 'idle' && (
                <div className="w-full flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      {uploadStage === 'presigning' && (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          Generating Presigned URL...
                        </>
                      )}
                      {uploadStage === 'uploading' && (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          Uploading to S3 Bucket...
                        </>
                      )}
                      {uploadStage === 'confirming' && (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          Registering Document...
                        </>
                      )}
                      {uploadStage === 'done' && (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Upload Complete!
                        </>
                      )}
                      {uploadStage === 'error' && (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Upload Failed
                        </>
                      )}
                    </span>
                    <span className="text-slate-500 font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        uploadStage === 'done'
                          ? 'bg-emerald-500'
                          : uploadStage === 'error'
                            ? 'bg-rose-500'
                            : 'bg-indigo-600'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              {uploadStage === 'idle' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={executeUpload}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    Upload PDF to S3
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Choose Different File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Uploaded Documents</h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={() => refetchDocs()}
              disabled={isRefetching}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        {docsLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span>Loading documents...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No documents uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Upload your first PDF above. The document will be stored in your S3 bucket and ready
                for AI FAQ indexing.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{doc.file_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>{formatFileSize(doc.file_size_bytes)}</span>
                      <span>•</span>
                      <span className="truncate max-w-xs">{doc.s3_key}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-sans">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      doc.status === 'uploaded'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        doc.status === 'uploaded' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {doc.status === 'uploaded' ? 'Uploaded to S3' : 'Pending'}
                  </span>

                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
