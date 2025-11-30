import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table2 } from 'lucide-react';
import { QueryResult } from '../types';

interface QueryResultTableProps {
    result: QueryResult | null;
    isExecuting: boolean;
}

const QueryResultTable: React.FC<QueryResultTableProps> = ({ result, isExecuting }) => {
    const { t } = useTranslation();

    if (isExecuting) {
        return (
            <div className="flex items-center justify-center h-full bg-theme-primary">
                <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="text-xs text-theme-tertiary">Executing query...</div>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="flex items-center justify-center h-full bg-theme-primary">
                <div className="text-center space-y-2">
                    <Table2 className="w-8 h-8 text-theme-muted mx-auto" />
                    <div className="text-xs text-theme-tertiary">No results to display</div>
                </div>
            </div>
        );
    }

    if (result.error) {
        return (
            <div className="p-4 bg-theme-primary h-full overflow-auto">
                <div className="text-red-400 text-xs font-mono whitespace-pre-wrap">
                    {result.error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full glass-subtle">
            {/* Result Stats Bar */}
            <div className="h-8 flex items-center justify-between px-3 border-b border-white/5 glass-subtle shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-theme-tertiary">Query executed successfully</span>
                    <span className="text-xs text-violet-400 font-medium">{result.rows?.length || 0} rows</span>
                    {result.executionTimeMs !== undefined && (
                        <span className="text-xs text-theme-muted ml-2">{result.executionTimeMs}ms</span>
                    )}
                </div>
            </div>

            {/* Table Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="glass-strong sticky top-0 z-10">
                        <tr>
                            <th className="w-10 p-2 text-[10px] font-medium text-theme-tertiary border-b border-r border-white/5 text-center">
                                #
                            </th>
                            {result.columns.map((col, i) => (
                                <th key={i} className="p-2 text-xs font-medium text-theme-secondary border-b border-r border-white/5 whitespace-nowrap min-w-[100px]">
                                    <div className="flex items-center gap-1">
                                        {col}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="">
                        {result.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-white/5 group border-b border-white/5">
                                <td className="p-2 text-[10px] text-theme-muted border-r border-white/5 text-center glass-subtle group-hover:bg-white/5">
                                    {rowIndex + 1}
                                </td>
                                {row.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="p-2 text-xs text-theme-tertiary border-r border-white/5 whitespace-nowrap max-w-[300px] overflow-hidden text-ellipsis">
                                        {cell === null ? (
                                            <span className="text-theme-muted italic">NULL</span>
                                        ) : (
                                            String(cell)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QueryResultTable;
