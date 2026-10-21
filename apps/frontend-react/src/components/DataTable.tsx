import { Loader2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Pagination } from './Pagination';

export interface Column<T> {
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  keyExtractor: (item: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  pageSize = 5,
  emptyMessage = 'No records found.',
  keyExtractor,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = data.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const validPage = Math.min(currentPage, totalPages);
  if (validPage !== currentPage && validPage > 0) {
    setCurrentPage(validPage);
  }

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, validPage, pageSize]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
          <span className="text-xs font-medium">Loading data...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-6 py-3.5 ${col.headerClassName || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={keyExtractor(item, idx)}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
                        {col.cell(item, idx)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared Bottom Pagination Component */}
      <Pagination
        currentPage={validPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
