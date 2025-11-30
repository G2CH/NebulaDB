
import React from 'react';
import { ForeignKeyDef, ColumnDef } from './types';
import { Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForeignKeysTabProps {
  foreignKeys: ForeignKeyDef[];
  setForeignKeys: React.Dispatch<React.SetStateAction<ForeignKeyDef[]>>;
  columns: ColumnDef[];
  // Mock list of other tables in the db
  availableTables: string[];
}

const ForeignKeysTab: React.FC<ForeignKeysTabProps> = ({ foreignKeys, setForeignKeys, columns, availableTables }) => {
  const { t } = useTranslation();

  const handleAddFK = () => {
    setForeignKeys([...foreignKeys, {
      id: `fk_${Date.now()}`,
      status: 'new',
      name: `fk_new_${foreignKeys.length + 1}`,
      sourceColumn: '',
      refTable: '',
      refColumn: 'id',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }]);
  };

  const handleDelete = (id: string) => {
    setForeignKeys(prev => prev.filter(fk => fk.id !== id));
  };

  const handleUpdate = (id: string, field: keyof ForeignKeyDef, value: any) => {
    setForeignKeys(prev => prev.map(fk => {
      if (fk.id === id) return { ...fk, [field]: value, status: fk.status === 'new' ? 'new' : 'modified' };
      return fk;
    }));
  };

  const ActionSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none appearance-none cursor-pointer"
    >
      <option value="RESTRICT">{t('tableDesigner.foreignKeys.actions.restrict')}</option>
      <option value="CASCADE">{t('tableDesigner.foreignKeys.actions.cascade')}</option>
      <option value="SET NULL">{t('tableDesigner.foreignKeys.actions.setNull')}</option>
      <option value="NO ACTION">{t('tableDesigner.foreignKeys.actions.noAction')}</option>
    </select>
  );

  return (
    <div className="p-6 h-full overflow-y-auto glass-subtle space-y-4">
      {foreignKeys.map((fk) => (
        <div key={fk.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.foreignKeys.constraintName')}</label>
              <input
                type="text"
                value={fk.name}
                onChange={(e) => handleUpdate(fk.id, 'name', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleDelete(fk.id)}
              className="text-zinc-500 hover:text-red-400 p-2 hover:bg-zinc-800 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 p-3 bg-zinc-950/50 border border-zinc-800/50 rounded">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.foreignKeys.sourceColumn')}</label>
              <select
                value={fk.sourceColumn}
                onChange={(e) => handleUpdate(fk.id, 'sourceColumn', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
              >
                <option value="">{t('tableDesigner.foreignKeys.sourceColumn')}...</option>
                {columns.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-center pt-5">
              <div className="h-px bg-zinc-700 w-8"></div>
              <span className="text-xs text-zinc-500 px-2">{t('tableDesigner.foreignKeys.references').toUpperCase()}</span>
              <div className="h-px bg-zinc-700 w-8"></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.foreignKeys.targetTable')}</label>
              <div className="flex gap-2">
                <select
                  value={fk.refTable}
                  onChange={(e) => handleUpdate(fk.id, 'refTable', e.target.value)}
                  className="w-1/2 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
                >
                  <option value="">{t('tableDesigner.foreignKeys.targetTable')}...</option>
                  {availableTables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="text"
                  value={fk.refColumn}
                  onChange={(e) => handleUpdate(fk.id, 'refColumn', e.target.value)}
                  placeholder="id"
                  className="w-1/2 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.foreignKeys.onDelete')}</label>
              <ActionSelect value={fk.onDelete} onChange={(v) => handleUpdate(fk.id, 'onDelete', v)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('tableDesigner.foreignKeys.onUpdate')}</label>
              <ActionSelect value={fk.onUpdate} onChange={(v) => handleUpdate(fk.id, 'onUpdate', v)} />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddFK}
        className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        {t('tableDesigner.foreignKeys.addForeignKey')}
      </button>
    </div>
  );
};

export default ForeignKeysTab;
