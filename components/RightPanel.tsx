
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table2,
    Key,
    Link2,
    Info,
    X,
    ChevronRight,
    Columns
} from 'lucide-react';
import { getTableStructure, getTableIndexes, getForeignKeys, getTableInfo } from '../services/dbService';

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
    width?: number;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    tableName?: string | null;
    connectionId?: string | null;
    database?: string | null;
    connectionType?: string | null;
}

type Tab = 'structure' | 'indexes' | 'foreignKeys' | 'info';

interface TableInfo {
    rowCount: string;
    size: string;
    engine: string;
    collation: string;
    comment?: string;
}

const RightPanel: React.FC<RightPanelProps> = ({
    isOpen,
    onClose,
    width,
    activeTab,
    setActiveTab,
    tableName,
    connectionId,
    database,
    connectionType
}) => {
    const { t } = useTranslation();
    const [columns, setColumns] = useState<any[]>([]);
    const [indexes, setIndexes] = useState<any[]>([]);
    const [foreignKeys, setForeignKeys] = useState<any[]>([]);
    const [tableInfo, setTableInfo] = useState<TableInfo>({ rowCount: '-', size: '-', engine: '-', collation: '-' });
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!tableName || !connectionId || !database || !connectionType) return;

            setIsLoading(true);
            try {
                if (activeTab === 'structure') {
                    const data = await getTableStructure(connectionId, tableName, database, connectionType);
                    setColumns(data);
                } else if (activeTab === 'indexes') {
                    const data = await getTableIndexes(connectionId, tableName, connectionType);
                    setIndexes(data);
                } else if (activeTab === 'foreignKeys') {
                    const data = await getForeignKeys(connectionId, tableName, connectionType);
                    setForeignKeys(data);
                } else if (activeTab === 'info') {
                    const info = await getTableInfo(connectionId, tableName, database, connectionType);
                    setTableInfo(info);
                }
            } catch (error) {
                console.error('Failed to fetch table details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && tableName) {
            fetchData();
        }
    }, [tableName, connectionId, database, connectionType, isOpen, activeTab]);

    if (!isOpen) return null;

    return (
        <div className="w-full h-full glass-strong flex flex-col">
            {/* Compact Header with Tabs */}
            <div className="flex flex-col border-b border-white/5 glass-subtle">
                {/* Table Name & Close */}
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Table2 className="w-4 h-4 text-violet-500 shrink-0" />
                        <span className="text-sm font-medium text-theme-primary truncate" title={tableName || ''}>
                            {tableName || t('rightPanel.title')}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-theme-tertiary hover-text-primary">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-2 gap-1">
                    {[
                        { id: 'structure' as Tab, label: t('rightPanel.structure'), icon: Columns },
                        { id: 'indexes' as Tab, label: t('rightPanel.indexes'), icon: Key },
                        { id: 'foreignKeys' as Tab, label: t('rightPanel.foreignKeys'), icon: Link2 },
                        { id: 'info' as Tab, label: t('rightPanel.info'), icon: Info },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center justify-center p-2 rounded-t-md transition-all relative
                                ${activeTab === tab.id
                                    ? 'text-theme-primary bg-theme-primary border-t border-x border-theme-primary -mb-px z-10'
                                    : 'text-theme-tertiary hover-text-secondary hover-bg-tertiary'}
                            `}
                            title={tab.label}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0">
                {!tableName ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 p-4">
                        <Table2 className="w-10 h-10 text-zinc-800" />
                        <p className="text-xs text-zinc-600">{t('rightPanel.selectTable')}</p>
                    </div>
                ) : (
                    <div className="p-3">
                        {activeTab === 'structure' && (
                            <div className="space-y-1">
                                {isLoading ? (
                                    <div className="text-center py-4 text-theme-tertiary text-xs">Loading...</div>
                                ) : columns.map((col, idx) => (
                                    <div key={idx} className="group flex items-center justify-between py-1.5 px-2 hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`w-1 h-1 rounded-full ${col.isPrimaryKey ? 'bg-yellow-500' : 'bg-theme-tertiary'}`} />
                                            <span className="text-xs text-theme-primary font-medium truncate">{col.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-theme-tertiary">
                                            <span>{col.type}</span>
                                            {col.isPrimaryKey && (
                                                <span className="px-1 rounded bg-yellow-500/10 text-yellow-500">
                                                    PRI
                                                </span>
                                            )}
                                            {col.isNotNull && !col.isPrimaryKey && (
                                                <span className="px-1 rounded bg-violet-500/10 text-violet-400">
                                                    NN
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'indexes' && (
                            <div className="space-y-2">
                                {isLoading ? (
                                    <div className="text-center py-4 text-theme-tertiary text-xs">Loading...</div>
                                ) : indexes.map((idx, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded p-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-theme-primary">{idx.name}</span>
                                            {idx.unique === 'Yes' && (
                                                <span className="text-[10px] text-blue-400">UNI</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-theme-tertiary">
                                            {Array.isArray(idx.columns) ? idx.columns.join(', ') : idx.columns}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'foreignKeys' && (
                            <div className="space-y-2">
                                {isLoading ? (
                                    <div className="text-center py-4 text-theme-tertiary text-xs">Loading...</div>
                                ) : foreignKeys.length > 0 ? (
                                    foreignKeys.map((fk, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 rounded p-2 space-y-1">
                                            <div className="text-xs font-medium text-theme-primary">{fk.name}</div>
                                            <div className="flex items-center gap-1 text-[10px] text-theme-tertiary">
                                                <span>{fk.column}</span>
                                                <ChevronRight className="w-3 h-3" />
                                                <span className="text-violet-400">{fk.refTable}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-600 text-center py-4">{t('rightPanel.noForeignKeys')}</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="space-y-0 text-xs">
                                <div className="flex justify-between py-2 border-b border-theme-secondary">
                                    <span className="text-theme-tertiary">{t('rightPanel.rows', 'Row Count')}</span>
                                    <span className="text-theme-primary font-mono">{tableInfo.rowCount}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-theme-secondary">
                                    <span className="text-theme-tertiary">{t('rightPanel.size', 'Size')}</span>
                                    <span className="text-theme-primary font-mono">{tableInfo.size}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-theme-secondary">
                                    <span className="text-theme-tertiary">{t('rightPanel.engine', 'Engine')}</span>
                                    <span className="text-theme-primary">{tableInfo.engine}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-theme-tertiary">{t('rightPanel.collation', 'Collation')}</span>
                                    <span className="text-theme-primary">{tableInfo.collation}</span>
                                </div>
                                {tableInfo.comment && (
                                    <div className="flex justify-between py-2 border-t border-theme-secondary">
                                        <span className="text-theme-tertiary">{t('rightPanel.comment', 'Comment')}</span>
                                        <span className="text-theme-primary text-xs">{tableInfo.comment}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightPanel;
