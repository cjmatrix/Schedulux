import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationFooterProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
  entityName?: string;
  pageSizeOptions?: number[];
  className?: string;
}

export function TablePaginationFooter({
  currentPage,
  totalCount,
  pageSize,
  totalPages,
  onPageChange,
  onLimitChange,
  isLoading = false,
  entityName = 'records',
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}: TablePaginationFooterProps) {
  const calculatedTotalPages = totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(totalCount, currentPage * pageSize);

  const renderPaginationButtons = () => {
    const buttons: (number | string)[] = [];

    if (calculatedTotalPages <= 5) {
      for (let i = 1; i <= calculatedTotalPages; i++) {
        buttons.push(i);
      }
    } else {
      buttons.push(1);
      if (currentPage > 3) buttons.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(calculatedTotalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        buttons.push(i);
      }
      if (currentPage < calculatedTotalPages - 2) buttons.push('...');
      buttons.push(calculatedTotalPages);
    }
    return buttons;
  };

  return (
    <div
      className={`p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-4 text-slate-500">
        <span>
          Showing <strong className="text-slate-900 font-semibold">{startEntry}</strong> to{' '}
          <strong className="text-slate-900 font-semibold">{endEntry}</strong> of{' '}
          <strong className="text-slate-900 font-semibold">{totalCount}</strong> {entityName}
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPaginationButtons().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 text-slate-400">
                ...
              </span>
            );
          }
          const isCurrent = p === currentPage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              disabled={isLoading}
              onClick={() => onPageChange(Number(p))}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isCurrent
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= calculatedTotalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
