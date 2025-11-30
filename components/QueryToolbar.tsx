import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Play,
    Square,
    Wand2,
    Clock,
    Database
} from 'lucide-react';

interface QueryToolbarProps {
    isExecuting: boolean;
    onExecute: () => void;
    onStop: () => void;
    onFormat?: () => void;
    onHistory?: () => void;
    connections?: { id: string; name: string; type: string }[];
    selectedConnectionId?: string | null;
    onSelectConnection?: (id: string) => void;
    databases?: string[];
    selectedDatabase?: string;
    onSelectDatabase?: (db: string) => void;
}

const QueryToolbar: React.FC<QueryToolbarProps> = ({
    isExecuting,
    onExecute,
    onStop,
    onFormat,
    onHistory,
    connections = [],
    selectedConnectionId,
    onSelectConnection,
    databases = [],
    selectedDatabase,
    onSelectDatabase
}) => {
    const { t } = useTranslation();

    return (
        <div className="h-8 border-b glass-subtle border-white/5 flex items-center justify-between px-2 shrink-0">
            <div className="flex items-center gap-2">
                {/* Connection Selector */}
                {connections && connections.length > 0 && (
                    <div className="flex items-center gap-1 mr-2">
                        <Database className="w-3 h-3 text-theme-muted" />
                        <select
                            value={selectedConnectionId || ''}
                            onChange={(e) => onSelectConnection?.(e.target.value)}
                            className="h-6 text-xs bg-transparent border rounded px-1 min-w-[120px] max-w-[200px] outline-none focus:border-violet-500 transition-colors"
                            style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="" disabled>{t('common.selectConnection', 'Select Connection')}</option>
                            {connections.map(conn => (
                                <option key={conn.id} value={conn.id}>{conn.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Database Selector */}
                {selectedConnectionId && databases && databases.length > 0 && (
                    <div className="flex items-center gap-1 mr-2">
                        <div className="text-theme-muted text-xs">/</div>
                        <select
                            value={selectedDatabase || ''}
                            onChange={(e) => onSelectDatabase?.(e.target.value)}
                            className="h-6 text-xs bg-transparent border rounded px-1 min-w-[100px] outline-none focus:border-violet-500 transition-colors"
                            style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="" disabled>{t('common.selectDatabase', 'Select Database')}</option>
                            {databases.map(db => (
                                <option key={db} value={db}>{db}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="h-4 w-[1px] bg-border mx-1" style={{ backgroundColor: 'var(--border-secondary)' }}></div>

                {/* Execute/Stop Button */}
                {isExecuting ? (
                    <button
                        onClick={onStop}
                        className="flex items-center gap-1 px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded text-xs transition-colors h-6"
                        title={t('topBar.stop')}
                    >
                        <Square className="w-3 h-3 fill-current" />
                        <span>{t('topBar.stop')}</span>
                    </button>
                ) : (
                    <button
                        onClick={onExecute}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 text-green-400 rounded text-xs font-medium transition-colors h-6"
                        title={t('topBar.execute')}
                    >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t('topBar.execute')}</span>
                    </button>
                )}

                {/* Format Button */}
                <button
                    onClick={onFormat}
                    className="p-1 border rounded transition-colors h-6"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                    title={t('topBar.format')}
                >
                    <Wand2 className="w-3 h-3" />
                </button>

                {/* History Button */}
                <button
                    onClick={onHistory}
                    className="p-1 border rounded transition-colors h-6"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                    title={t('topBar.history')}
                >
                    <Clock className="w-3 h-3" />
                </button>
            </div>

            <div className="text-[10px] text-theme-muted">
                Press <kbd className="px-1 py-0.5 border rounded" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-tertiary)' }}>Ctrl+Enter</kbd> to execute
            </div>
        </div>
    );
};

export default QueryToolbar;
