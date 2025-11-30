
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IndexDef, ColumnDef } from './types';
import { Trash2, Plus, ChevronDown } from 'lucide-react';

interface IndexesTabProps {
  indexes: IndexDef[];
  setIndexes: React.Dispatch<React.SetStateAction<IndexDef[]>>;
  columns: ColumnDef[];
}

const IndexesTab: React.FC<IndexesTabProps> = ({ indexes, setIndexes, columns }) => {
  const { t } = useTranslation();

  const handleAddIndex = () => {
    setIndexes([...indexes, {
      id: `idx_${Date.now()}`,
      status: 'new',
      name: `idx_new_${indexes.length + 1}`,
      type: 'NORMAL',
      columns: []
    }]);
  };

  const handleDelete = (id: string) => {
    setIndexes(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (id: string, field: keyof IndexDef, value: any) => {
    setIndexes(prev => prev.map(idx => {
      if (idx.id === id) return { ...idx, [field]: value, status: idx.status === 'new' ? 'new' : 'modified' };
      return idx;
    }));
  };

  const toggleColumn = (indexId: string, colName: string) => {
    setIndexes(prev => prev.map(idx => {
      if (idx.id === indexId) {
        const newCols = idx.columns.includes(colName)
          ? idx.columns.filter(c => c !== colName)
          : [...idx.columns, colName];
        return { ...idx, columns: newCols, status: idx.status === 'new' ? 'new' : 'modified' };
      }
      return idx;
    }));
  };

  return (
    <div className="p-6 h-full overflow-y-auto glass-subtle space-y-4">
      {indexes.map((idx) => (
        <div key={idx.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between">
            <div className="grid grid-cols-2 gap-4 flex-1 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.indexes.indexName')}</label>
                <input
                  type="text"
                  value={idx.name}
                  onChange={(e) => handleUpdate(idx.id, 'name', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.indexes.indexType')}</label>
                <select
                  value={idx.type}
                  onChange={(e) => handleUpdate(idx.id, 'type', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="NORMAL">{t('tableDesigner.indexes.types.normal')}</option>
                  <option value="UNIQUE">{t('tableDesigner.indexes.types.unique')}</option>
                  <option value="FULLTEXT">{t('tableDesigner.indexes.types.fulltext')}</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => handleDelete(idx.id)}
              className="text-zinc-500 hover:text-red-400 p-2 hover:bg-zinc-800 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.indexes.includedColumns')}</label>
            <div className="flex flex-wrap gap-2">
              {columns.map(col => {
                const isSelected = idx.columns.includes(col.name);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(idx.id, col.name)}
                    className={`
                                px-3 py-1 text-xs rounded-full border transition-all
                                ${isSelected
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/30'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
                            `}
                  >
                    {col.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddIndex}
        className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        {t('tableDesigner.indexes.addIndex')}
      </button>
    </div>
  );
};

export default IndexesTab;
