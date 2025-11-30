import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { QueryResult } from '../types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/ContextMenu';
import { Clipboard, FileJson, FileSpreadsheet, Ban, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResultTableProps {
  data: QueryResult | null;
  isLoading: boolean;
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
  };
  onPageChange?: (newOffset: number) => void;
}

const ResultTable: React.FC<ResultTableProps> = ({ data, isLoading, pagination, onPageChange }) => {
  const { t } = useTranslation();

  // Memoize columns definition based on data.columns
  const columns = useMemo<ColumnDef<any[]>[]>(() => {
    if (!data?.columns) return [];

    // Add index column
    const cols: ColumnDef<any[]>[] = [
      {
        id: 'index',
        header: '#',
        cell: info => <span className="text-theme-muted select-none">{info.row.index + 1}</span>,
        size: 50,
        enableResizing: false,
      }
    ];

    // Add data columns
    data.columns.forEach((colName, index) => {
      cols.push({
        id: colName,
        accessorFn: (row) => row[index],
        header: colName,
        cell: info => {
          const val = info.getValue();
          const rowData = info.row.original;

          const handleCopyValue = () => {
            if (val !== null && val !== undefined) {
              navigator.clipboard.writeText(String(val));
            }
          };

          const handleCopyRowJson = () => {
            // Reconstruct object with keys
            const obj: any = {};
            data.columns.forEach((key, idx) => {
              obj[key] = rowData[idx];
            });
            navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
          };

          const handleCopyRowCSV = () => {
            navigator.clipboard.writeText(rowData.join(','));
          };

          if (val === null || val === undefined) {
            return (
              <ContextMenu>
                <ContextMenuTrigger>
                  <span className="italic text-theme-muted text-[11px] block w-full">{t('resultTable.null')}</span>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem disabled>{t('resultTable.copyValue')}</ContextMenuItem>
                  <ContextMenuItem onClick={handleCopyRowJson}><FileJson className="mr-2 h-3.5 w-3.5" /> {t('resultTable.copyJson')}</ContextMenuItem>
                  <ContextMenuItem onClick={handleCopyRowCSV}><FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> {t('resultTable.copyCsv')}</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          }

          return (
            <ContextMenu>
              <ContextMenuTrigger>
                <span className="block truncate cursor-default" title={String(val)}>
                  {String(val)}
                </span>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={handleCopyValue}>
                  <Clipboard className="mr-2 h-3.5 w-3.5" />
                  {t('resultTable.copyValue')}
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCopyRowJson}>
                  <FileJson className="mr-2 h-3.5 w-3.5" />
                  {t('resultTable.copyJson')}
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCopyRowCSV}>
                  <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                  {t('resultTable.copyCsv')}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <Ban className="mr-2 h-3.5 w-3.5" />
                  {t('resultTable.setNull')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        },
      });
    });

    return cols;
  }, [data?.columns, t]);

  // Memoize data rows
  const tableData = useMemo(() => data?.rows || [], [data?.rows]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      size: 150,
      minSize: 50,
      maxSize: 500,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full glass-subtle">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl glass border border-violet-500/30 flex items-center justify-center mx-auto glow">
            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-theme-tertiary">{t('resultTable.running')}</p>
        </div>
      </div>
    );
  }

  // If no data or no columns (e.g. non-SELECT query), show status/error view
  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full glass-subtle">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl glass border border-white/10 flex items-center justify-center mx-auto">
            <div className="text-4xl text-theme-muted">∅</div>
          </div>
          <p className="text-sm text-theme-tertiary">{t('resultTable.noResults')}</p>
          {data?.error && <p className="text-red-400 mt-2 text-xs font-mono bg-red-500/10 px-3 py-2 rounded border border-red-500/20">{data.error}</p>}
          {data?.affectedRows !== undefined && <p className="text-theme-tertiary mt-2 text-xs">{t('resultTable.affectedRows')}: {data.affectedRows}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass-subtle">
      <div className="p-4 glass-subtle h-full overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="glass-strong sticky top-0 z-10 border-b border-theme-primary">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-left px-3 py-2.5 text-theme-tertiary font-semibold uppercase tracking-wider text-[10px] border-r border-theme-primary last:border-r-0"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="font-mono text-xs text-theme-secondary">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-theme-tertiary italic">
                  {t('resultTable.noRows', 'No rows found')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:glass-subtle transition-all border-b border-theme-primary last:border-b-0">
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && onPageChange && (
        <div className="h-10 border-t border-theme-primary glass-strong flex items-center justify-between px-4 shrink-0">
          <div className="text-[10px] text-theme-tertiary">
            Showing rows {pagination.offset + 1} - {pagination.offset + (data?.rows.length || 0)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
              className="p-1.5 rounded hover-bg-tertiary text-theme-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('common.previousPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-medium text-theme-secondary min-w-[3rem] text-center">
              Page {Math.floor(pagination.offset / pagination.limit) + 1}
            </span>
            <button
              onClick={() => onPageChange(pagination.offset + pagination.limit)}
              disabled={!data || data.rows.length < pagination.limit}
              className="p-1.5 rounded hover-bg-tertiary text-theme-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('common.nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultTable;