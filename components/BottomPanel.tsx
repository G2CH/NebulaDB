import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronUp,
    ChevronDown,
    Table2,
    Terminal,
    Clock,
    Sparkles,
    CheckCircle,
    Info,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import QueryResultTable from './QueryResultTable';

import { HistoryItem } from '../hooks/useQueryHistory';
import { ConsoleLog } from '../contexts/ConsoleContext';

interface BottomPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    queryResult: any;
    isExecuting: boolean;
    history?: HistoryItem[];
    onRerunQuery?: (query: string) => void;
    onClearHistory?: () => void;
    logs?: ConsoleLog[];
    onClearLogs?: () => void;
}

type BottomTab = 'results' | 'console' | 'history' | 'ai';

const BottomPanel: React.FC<BottomPanelProps> = ({ isOpen, onToggle, queryResult, isExecuting, history = [], onRerunQuery, onClearHistory, logs = [], onClearLogs }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<BottomTab>('results');

    if (!isOpen) {
        return (
            <div
                className="border-t border-white/5 h-9 glass-subtle flex items-center justify-between px-4 cursor-pointer transition-colors hover:bg-zinc-900/70"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    <Table2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs text-theme-secondary">{t('bottomPanel.results')}</span>
                    <span className="text-xs text-theme-muted">
                        {queryResult?.rows?.length || 0} {t('app.rows', { count: queryResult?.rows?.length || 0 })}
                    </span>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-theme-muted" />
            </div>
        );
    }

    return (
        <div className="border-t border-white/5 flex flex-col h-full glass-subtle">
            {/* Flat Tab Bar */}
            <div className="h-10 border-b border-theme-primary flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-1">
                    {[
                        { id: 'results' as BottomTab, label: t('bottomPanel.results'), icon: Table2 },
                        { id: 'console' as BottomTab, label: t('bottomPanel.console'), icon: Terminal },
                        { id: 'history' as BottomTab, label: t('bottomPanel.history'), icon: Clock },
                        { id: 'ai' as BottomTab, label: t('bottomPanel.ai'), icon: Sparkles },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                            style={{
                                backgroundColor: activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)'
                            }}
                            onMouseEnter={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                            onMouseLeave={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; } }}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onToggle}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'results' && (
                    <div className="h-full">
                        <QueryResultTable
                            result={queryResult}
                            isExecuting={isExecuting}
                        />
                    </div>
                )}

                {activeTab === 'console' && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-theme-tertiary">
                                {logs.length} {t('bottomPanel.logEntries', { count: logs.length })}
                            </div>
                            {logs.length > 0 && (
                                <button
                                    onClick={onClearLogs}
                                    className="text-xs px-2 py-1 rounded-md transition-colors"
                                    style={{ color: 'var(--text-tertiary)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                                >
                                    {t('bottomPanel.clearLogs')}
                                </button>
                            )}
                        </div>

                        {logs.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Terminal className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <div className="text-xs text-theme-muted">{t('bottomPanel.noLogs')}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1 overflow-y-auto font-mono text-xs">
                                {logs.map(log => {
                                    const getLogColor = () => {
                                        switch (log.level) {
                                            case 'success': return 'text-green-500';
                                            case 'error': return 'text-red-500';
                                            case 'warning': return 'text-yellow-500';
                                            case 'info': return 'text-blue-400';
                                        }
                                    };

                                    const getLogIcon = () => {
                                        switch (log.level) {
                                            case 'success': return <CheckCircle className="w-3 h-3" />;
                                            case 'error': return <XCircle className="w-3 h-3" />;
                                            case 'warning': return <AlertTriangle className="w-3 h-3" />;
                                            case 'info': return <Info className="w-3 h-3" />;
                                        }
                                    };

                                    return (
                                        <div key={log.id} className="flex gap-2 p-2 rounded-md" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                            <span className={`shrink-0 ${getLogColor()}`}>
                                                {getLogIcon()}
                                            </span>
                                            <span className="text-theme-muted shrink-0">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-theme-secondary">{log.message}</div>
                                                {log.details && (
                                                    <div className="text-theme-muted mt-1 break-all">{log.details}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-theme-tertiary">
                                {history.length} {t('bottomPanel.historyItems', { count: history.length })}
                            </div>
                            {history.length > 0 && (
                                <button
                                    onClick={onClearHistory}
                                    className="text-xs px-2 py-1 rounded-md transition-colors"
                                    style={{ color: 'var(--text-tertiary)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                                >
                                    {t('bottomPanel.clearHistory')}
                                </button>
                            )}
                        </div>

                        {history.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <div className="text-xs text-theme-muted">{t('bottomPanel.noHistory')}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-y-auto">
                                {history.map(item => (
                                    <div
                                        key={item.id}
                                        className="border rounded-md p-3 transition-colors cursor-pointer"
                                        style={{
                                            backgroundColor: 'var(--bg-primary)',
                                            borderColor: item.status === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                        onClick={() => onRerunQuery && onRerunQuery(item.query)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {item.status === 'success' ? (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                                )}
                                                <span className="text-xs text-theme-tertiary truncate">
                                                    {item.connectionName || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-theme-muted truncate">
                                                    {new Date(item.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {item.rowCount !== undefined && (
                                                    <span className="text-xs text-theme-tertiary">
                                                        {item.rowCount} {t('app.rows', { count: item.rowCount })}
                                                    </span>
                                                )}
                                                <span className="text-xs text-theme-muted">
                                                    {item.executionTimeMs}ms
                                                </span>
                                            </div>
                                        </div>
                                        <pre className="text-xs font-mono text-theme-secondary whitespace-pre-wrap break-all">
                                            {item.query}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                            <div className="text-xs text-zinc-500">AI Assistant panel</div>
                            <div className="text-xs text-zinc-700 mt-1">Coming soon...</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BottomPanel;
