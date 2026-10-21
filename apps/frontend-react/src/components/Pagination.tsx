import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  entityName?: string;
  variant?: 'table' | 'standalone';
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false,
  entityName = 'results',
  variant = 'table',
  className = '',
}: PaginationProps) {
  if (totalCount === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  if (variant === 'standalone') {
    return (
      <div
        className={`flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/80 pt-6 mt-2 gap-4 ${className}`}
      >
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{startRecord}</span> to{' '}
          <span className="font-semibold text-slate-800">{endRecord}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> {entityName}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 px-2">
            <span>Page</span>
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
              {currentPage}
            </span>
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            aria-label="Next Page"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 ${className}`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-slate-400" />
        <span>
          Showing{' '}
          <strong className="text-slate-800">
            {startRecord} to {endRecord}
          </strong>{' '}
          of <strong className="text-slate-800">{totalCount}</strong> {entityName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || isLoading}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-medium text-slate-500 px-1">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || isLoading}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
