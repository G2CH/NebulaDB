import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import { X, Download, FileJson, FileSpreadsheet, FileCode } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  connectionId: string | null;
  connectionType?: string;
  currentQuery?: string;
  pagination?: { limit: number; offset: number };
  databaseName?: string | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, tableName, connectionId, connectionType, currentQuery, pagination, databaseName }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [format, setFormat] = useState<'csv' | 'json' | 'sql'>('csv');
  const [scope, setScope] = useState<'current' | 'all'>('all');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [encoding, setEncoding] = useState('UTF-8');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!connectionId) {
      toast.warning(t('exportModal.noConnection', 'No active connection'));
      return;
    }

    setIsExporting(true);
    try {
      // Import dbService dynamically
      const { executeQuery } = await import('../services/dbService');

      // Fetch data
      let query = `SELECT * FROM ${tableName}`;
      // Use fully qualified name for MySQL
      if (connectionType === 'mysql' && databaseName) {
        query = `SELECT * FROM \`${databaseName}\`.\`${tableName}\``;
      }

      if (scope === 'current' && currentQuery && pagination) {
        // Use the current query with pagination if available
        // We need to ensure we don't double up on LIMIT/OFFSET if they are already in currentQuery
        // But usually currentQuery in editor might be just "SELECT * FROM table" and App.tsx appends LIMIT/OFFSET
        // Wait, activeTab.content in App.tsx for TABLE_VIEW is just "SELECT * FROM table"
        // The LIMIT/OFFSET is applied in executeTableQuery or handleRunQuery

        // So we should construct it manually here
        query = `${currentQuery} LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
      }

      const result = await executeQuery(connectionId, query, undefined, connectionType);

      if (result.error) {
        throw new Error(result.error);
      }

      let content = '';
      const mimeType = 'text/plain';
      const extension = format;

      if (format === 'json') {
        // JSON Export
        const data = result.rows.map(row => {
          const obj: Record<string, any> = {};
          result.columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          return obj;
        });
        content = JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        // CSV Export
        const header = result.columns.join(',');
        const rows = result.rows.map(row =>
          row.map(cell => {
            if (cell === null) return '';
            const str = String(cell);
            // Escape quotes and wrap in quotes if contains comma or quote
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(',')
        );
        content = includeHeader ? [header, ...rows].join('\n') : rows.join('\n');
      } else if (format === 'sql') {
        // SQL Export (INSERT statements)
        const cols = result.columns.join(', ');
        const statements = result.rows.map(row => {
          const values = row.map(cell => {
            if (cell === null) return 'NULL';
            if (typeof cell === 'number') return cell;
            // Simple escaping for SQL
            return `'${String(cell).replace(/'/g, "''")}'`;
          }).join(', ');
          return `INSERT INTO ${tableName} (${cols}) VALUES (${values});`;
        });
        content = statements.join('\n');
      }

      // Trigger Download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('exportModal.success', 'Data exported successfully'));
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportModal.exportFailed', 'Export failed'), String(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[550px] glass-strong rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-violet-600/20 border-b border-theme-primary flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center glow-hover">
              <Download className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              {t('exportModal.title')}
              <span className="text-sm text-theme-tertiary font-normal">{t('exportModal.from')} <span className="text-violet-300">{tableName}</span></span>
            </div>
          </h2>
          <button onClick={onClose} className="text-theme-tertiary hover:text-theme-primary transition-colors p-2 hover:bg-theme-tertiary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">{t('exportModal.format')}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
                { id: 'json', label: 'JSON', icon: FileJson },
                { id: 'sql', label: 'SQL', icon: FileCode },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFormat(type.id as any)}
                  className={`
                                group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border transition-all duration-300
                                ${format === type.id
                      ? 'glass border-violet-500/50 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                      : 'glass-subtle border-theme-primary text-theme-tertiary hover:bg-theme-tertiary hover:text-theme-secondary'}
                            `}
                >
                  <type.icon className="w-7 h-7" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">{t('exportModal.settings')}</label>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 glass-subtle rounded-xl border border-theme-primary">
                <span className="text-sm text-theme-secondary font-medium">{t('exportModal.includeHeader')}</span>
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={e => setIncludeHeader(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-violet-500 focus:ring-violet-500/50 w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 glass-subtle rounded-xl border border-theme-primary">
                <span className="text-sm text-theme-secondary font-medium">{t('exportModal.encoding')}</span>
                <select
                  value={encoding}
                  onChange={e => setEncoding(e.target.value)}
                  className="glass border border-theme-primary text-theme-secondary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                  <option value="UTF-8">UTF-8</option>
                  <option value="UTF-16">UTF-16</option>
                  <option value="ISO-8859-1">ISO-8859-1</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">{t('exportModal.scope')}</label>
            <div className="flex glass-subtle p-1.5 rounded-xl border border-theme-primary">
              <button
                onClick={() => setScope('current')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${scope === 'current'
                  ? 'glass-strong text-violet-300 shadow-sm border border-violet-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {t('exportModal.currentPage')}
              </button>
              <button
                onClick={() => setScope('all')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${scope === 'all'
                  ? 'glass-strong text-violet-300 shadow-sm border border-violet-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {t('exportModal.allRows')}
              </button>
            </div>
          </div>

          {/* Output Path Mock */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">{t('exportModal.outputPath')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`~/Downloads/${tableName}_export.${format}`}
                className="flex-1 glass-subtle border border-theme-primary text-theme-tertiary text-sm rounded-xl px-4 py-2.5 focus:outline-none cursor-not-allowed"
              />
              {/* Browse button removed as we use browser download */}
            </div>
            <p className="text-[10px] text-theme-tertiary mt-1">* {t('exportModal.browserDownloadNote')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-theme-primary flex items-center justify-end gap-3 px-6 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-violet-600/10">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-theme-tertiary hover:text-theme-primary transition-colors"
          >
            {t('exportModal.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95 flex items-center gap-2 glow-hover border border-violet-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? t('exportModal.exporting') : t('exportModal.export')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExportModal;
