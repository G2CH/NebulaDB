
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColumnDef } from './types';
import { Trash2, Key, GripVertical, ChevronDown, Check, RotateCcw } from 'lucide-react';

interface ColumnsTabProps {
  columns: ColumnDef[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnDef[]>>;
}

const MYSQL_TYPES = [
  'INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP',
  'DECIMAL', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'BLOB', 'JSON', 'ENUM', 'SERIAL', 'UUID'
];

const ColumnsTab: React.FC<ColumnsTabProps> = ({ columns, setColumns }) => {
  const { t } = useTranslation();

  const handleUpdate = (id: string, field: keyof ColumnDef, value: any) => {
    setColumns(prev => prev.map(col => {
      if (col.id === id) {
        if (col.status === 'deleted') return col; // Cannot edit deleted rows

        let newStatus = col.status;
        if (newStatus === 'clean') newStatus = 'modified';

        return { ...col, [field]: value, status: newStatus };
      }
      return col;
    }));
  };

  const handleDelete = (id: string) => {
    setColumns(prev => prev.map(c => {
      if (c.id === id) {
        // If it's a new row, just remove it
        if (c.status === 'added') return null;
        // Otherwise mark as deleted
        return { ...c, status: 'deleted' };
      }
      return c;
    }).filter(Boolean) as ColumnDef[]);
  };

  const handleUndo = (id: string) => {
    setColumns(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: 'clean' }; // Revert to clean (simplified)
      }
      return c;
    }));
  };

  const handleAddColumn = () => {
    const newCol: ColumnDef = {
      id: `col_${Date.now()}`,
      status: 'added',
      name: `column_${columns.length + 1}`,
      type: 'VARCHAR',
      length: '255',
      isPrimaryKey: false,
      isNotNull: false,
      isAutoIncrement: false,
      defaultValue: '',
      comment: ''
    };
    setColumns([...columns, newCol]);
  };

  const getRowStyle = (status: string) => {
    switch (status) {
      case 'added': return 'bg-emerald-500/10 hover:bg-emerald-500/20';
      case 'modified': return 'bg-amber-500/10 hover:bg-amber-500/20';
      case 'deleted': return 'bg-red-500/10 hover:bg-red-500/20 opacity-70';
      default: return 'hover-bg-tertiary';
    }
  };

  return (
    <div className="flex flex-col h-full glass-subtle">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 glass-strong border-b border-white/5">
            <tr>
              <th className="w-8 p-2"></th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-48">{t('tableDesigner.columns.name')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-40">{t('tableDesigner.columns.type')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-24">{t('tableDesigner.columns.length')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-8" title={t('tableDesigner.columns.primaryKey')}>{t('tableDesigner.columns.pk')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-8" title={t('tableDesigner.columns.notNull')}>{t('tableDesigner.columns.nn')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-8" title={t('tableDesigner.columns.autoIncrement')}>{t('tableDesigner.columns.ai')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary w-32">{t('tableDesigner.columns.default')}</th>
              <th className="p-2 text-xs font-semibold text-theme-tertiary">{t('tableDesigner.columns.comment')}</th>
              <th className="w-10 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, idx) => (
              <tr key={col.id} className={`group border-b border-white/5 ${getRowStyle(col.status)}`}>
                {/* Status Indicator */}
                <td className="p-2 text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto ${col.status === 'added' ? 'bg-emerald-500' :
                    col.status === 'modified' ? 'bg-amber-500' :
                      col.status === 'deleted' ? 'bg-red-500' : 'bg-transparent'
                    }`} />
                </td>

                {/* Name */}
                <td className="p-1 relative">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => handleUpdate(col.id, 'name', e.target.value)}
                    disabled={col.status === 'deleted'}
                    className={`w-full bg-transparent border border-transparent focus:border-indigo-500/50 rounded px-2 py-1 text-sm focus:bg-theme-secondary focus:outline-none placeholder-zinc-500 ${col.status === 'deleted' ? 'line-through text-theme-tertiary' : 'text-theme-primary'}`}
                  />
                  {col.originalName && col.name !== col.originalName && col.status !== 'deleted' && (
                    <div className="absolute top-[2px] right-2 text-[10px] text-theme-tertiary bg-theme-secondary px-1 rounded pointer-events-none">
                      {t('tableDesigner.columns.was')}: {col.originalName}
                    </div>
                  )}
                </td>

                {/* Type */}
                <td className="p-1 relative">
                  <div className="relative group/select">
                    <select
                      value={col.type}
                      onChange={(e) => handleUpdate(col.id, 'type', e.target.value)}
                      disabled={col.status === 'deleted'}
                      className={`w-full appearance-none bg-transparent border border-transparent focus:border-indigo-500/50 rounded px-2 py-1 text-sm focus:bg-theme-secondary focus:outline-none cursor-pointer font-mono ${col.status === 'deleted' ? 'line-through text-theme-tertiary' : 'text-theme-secondary'}`}
                    >
                      {MYSQL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </td>

                {/* Length */}
                <td className="p-1">
                  <input
                    type="text"
                    value={col.length}
                    onChange={(e) => handleUpdate(col.id, 'length', e.target.value)}
                    disabled={col.status === 'deleted'}
                    placeholder={col.type === 'VARCHAR' ? '255' : ''}
                    className={`w-full bg-transparent border border-transparent focus:border-indigo-500/50 rounded px-2 py-1 text-sm focus:bg-theme-secondary focus:outline-none font-mono placeholder-zinc-500 ${col.status === 'deleted' ? 'line-through text-theme-tertiary' : 'text-theme-tertiary focus:text-theme-primary'}`}
                  />
                </td>

                {/* Flags */}
                <td className="p-1 text-center">
                  <input
                    type="checkbox"
                    checked={col.isPrimaryKey}
                    onChange={(e) => handleUpdate(col.id, 'isPrimaryKey', e.target.checked)}
                    disabled={col.status === 'deleted'}
                    className="rounded bg-theme-secondary border-theme-secondary text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-50"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="checkbox"
                    checked={col.isNotNull}
                    onChange={(e) => handleUpdate(col.id, 'isNotNull', e.target.checked)}
                    disabled={col.status === 'deleted'}
                    className="rounded bg-theme-secondary border-theme-secondary text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-50"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="checkbox"
                    checked={col.isAutoIncrement}
                    onChange={(e) => handleUpdate(col.id, 'isAutoIncrement', e.target.checked)}
                    disabled={col.status === 'deleted' || (!['INT', 'BIGINT', 'SERIAL'].includes(col.type) && !col.isPrimaryKey)}
                    className="rounded bg-theme-secondary border-theme-secondary text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </td>

                {/* Default */}
                <td className="p-1">
                  <input
                    type="text"
                    value={col.defaultValue}
                    onChange={(e) => handleUpdate(col.id, 'defaultValue', e.target.value)}
                    disabled={col.status === 'deleted'}
                    placeholder="NULL"
                    className={`w-full bg-transparent border border-transparent focus:border-indigo-500/50 rounded px-2 py-1 text-sm focus:bg-theme-secondary focus:outline-none placeholder-zinc-500 italic ${col.status === 'deleted' ? 'line-through text-theme-tertiary' : 'text-theme-tertiary focus:text-theme-primary'}`}
                  />
                </td>

                {/* Comment */}
                <td className="p-1">
                  <input
                    type="text"
                    value={col.comment}
                    onChange={(e) => handleUpdate(col.id, 'comment', e.target.value)}
                    disabled={col.status === 'deleted'}
                    className={`w-full bg-transparent border border-transparent focus:border-indigo-500/50 rounded px-2 py-1 text-sm focus:bg-theme-secondary focus:outline-none ${col.status === 'deleted' ? 'line-through text-theme-tertiary' : 'text-theme-tertiary focus:text-theme-primary'}`}
                  />
                </td>

                {/* Actions */}
                <td className="p-1 text-center">
                  {col.status === 'deleted' ? (
                    <button
                      onClick={() => handleUndo(col.id)}
                      className="text-theme-tertiary hover-text-primary p-1 rounded hover-bg-tertiary transition-colors"
                      title={t('tableDesigner.columns.undoDelete')}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(col.id)}
                      className="text-theme-tertiary hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title={t('tableDesigner.columns.deleteColumn')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-white/5 glass-subtle">
        <button
          onClick={handleAddColumn}
          className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-theme-secondary rounded text-theme-tertiary hover-text-secondary hover:border-theme-tertiary hover-bg-tertiary transition-all text-sm"
        >
          {t('tableDesigner.columns.addColumn')}
        </button>
      </div>
    </div>
  );
};

export default ColumnsTab;
