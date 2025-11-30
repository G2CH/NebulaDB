
import React from 'react';
import { X, Play, Copy } from 'lucide-react';
import SqlEditor from '../SqlEditor';

interface SqlPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sql: string;
  onExecute: () => void;
}

const SqlPreviewDialog: React.FC<SqlPreviewDialogProps> = ({ isOpen, onClose, sql, onExecute }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[800px] h-[600px] glass-strong border border-white/10 rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="h-12 glass-subtle border-b border-white/5 flex items-center justify-between px-4 shrink-0">
          <h2 className="text-sm font-medium text-zinc-200">Review SQL Changes</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <SqlEditor value={sql} onChange={() => { }} readOnly={true} />
        </div>

        {/* Footer */}
        <div className="h-14 border-t border-white/5 flex items-center justify-end gap-3 px-4 glass-subtle shrink-0">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy SQL
          </button>
          <button
            onClick={onExecute}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};

export default SqlPreviewDialog;
