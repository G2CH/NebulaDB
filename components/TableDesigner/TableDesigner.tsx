
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Code2, X } from 'lucide-react';
import ColumnsTab from './ColumnsTab';
import IndexesTab from './IndexesTab';
import ForeignKeysTab from './ForeignKeysTab';
import SqlPreviewDialog from './SqlPreviewDialog';
import OptionsTab from './OptionsTab';
import { ColumnDef, IndexDef, ForeignKeyDef } from './types';
import { generateCreateTableSQL, generateAlterTableSQL } from '../../utils/sqlGenerator';
import { useToast } from '../../contexts/ToastContext';

interface TableDesignerProps {
    initialTableName?: string;
    initialColumns?: ColumnDef[];
    onClose: () => void;
    onSave?: () => void; // Callback to refresh sidebar
    activeConnectionId?: string | null;
    activeDatabase?: string | null;
    connectionType?: string;
}

const TableDesigner: React.FC<TableDesignerProps> = ({
    initialTableName,
    initialColumns,
    onClose,
    onSave,
    activeConnectionId,
    activeDatabase,
    connectionType = 'postgres'
}) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'fks' | 'options'>('columns');
    const [tableName, setTableName] = useState(initialTableName || 'new_table');
    const [comment, setComment] = useState('');

    // State
    const [columns, setColumns] = useState<ColumnDef[]>([
        { id: 'col_1', status: 'clean', name: 'id', type: 'INT', length: '', isPrimaryKey: true, isNotNull: true, isAutoIncrement: true, defaultValue: '', comment: '' }
    ]);
    const [indexes, setIndexes] = useState<IndexDef[]>([]);
    const [foreignKeys, setForeignKeys] = useState<ForeignKeyDef[]>([]);
    const [availableTables, setAvailableTables] = useState<string[]>([]);

    // Table options state
    const [tableCharset, setTableCharset] = useState('utf8mb4');
    const [tableCollation, setTableCollation] = useState('utf8mb4_0900_ai_ci');
    const [tableEngine, setTableEngine] = useState('InnoDB');
    const [tableAutoIncrement, setTableAutoIncrement] = useState(1);

    const isEditMode = !!initialColumns;

    // Fetch available tables for Foreign Keys
    useEffect(() => {
        const fetchTables = async () => {
            if (activeConnectionId) {
                try {
                    const { getTables } = await import('../../services/dbService');
                    const tables = await getTables(activeConnectionId, activeDatabase || undefined, (connectionType || 'postgres') as 'postgres' | 'mysql' | 'sqlite');
                    setAvailableTables(tables);
                } catch (e) {
                    console.error("Failed to fetch tables", e);
                }
            }
        };
        fetchTables();
    }, [activeConnectionId, activeDatabase]);

    // Initialize with existing columns if provided
    useEffect(() => {
        if (initialColumns) {
            setColumns(initialColumns);
        }
    }, [initialColumns]);

    // Preview
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewSql, setPreviewSql] = useState('');

    const handlePreview = () => {
        let sql = '';
        if (isEditMode) {
            // generateAlterTableSQL returns string[]
            const statements = generateAlterTableSQL(tableName, initialColumns || [], columns, connectionType as any);
            sql = statements.join('\n');
        } else {
            sql = generateCreateTableSQL(tableName, columns, indexes, foreignKeys, '', connectionType as any);
        }
        setPreviewSql(sql);
        setIsPreviewOpen(true);
    };

    const handleSave = async () => {
        if (!activeConnectionId) {
            console.error('No active connection');
            return;
        }

        if (!tableName.trim()) {
            console.error('Table name required');
            return;
        }

        if (columns.length === 0) {
            console.error('At least one column required');
            return;
        }

        try {
            // Import utilities
            const { generateCreateTableSQL, generateAlterTableSQL } = await import('../../utils/sqlGenerator');
            const { executeQuery } = await import('../../services/dbService');
            const { useConsole } = await import('../../contexts/ConsoleContext');

            // Generate SQL
            let sql: string;
            if (isEditMode) {
                const statements = generateAlterTableSQL(
                    tableName,
                    initialColumns || [],
                    columns,
                    connectionType as any
                );

                // Execute statements sequentially or joined
                // For simplicity, we'll try to join them if the DB supports it, or execute one by one
                // But executeQuery takes one string.
                // Let's try executing one by one if there are multiple
                if (statements.length === 0) {
                    toast.info(t('tableDesigner.noChanges', 'No changes to save'));
                    onClose();
                    return;
                }

                for (const stmt of statements) {
                    await executeQuery(activeConnectionId, stmt, activeDatabase || undefined, connectionType);
                }

                // Success
                toast.success(t('tableDesigner.tableSaved', 'Table saved successfully'));
                if (onSave) onSave();
                onClose();
                return;

            } else {
                // Determine database type from connection
                const dbType = connectionType;

                sql = generateCreateTableSQL(
                    tableName,
                    columns,
                    indexes,
                    foreignKeys,
                    comment,
                    dbType as any,
                    {
                        charset: tableCharset,
                        collation: tableCollation,
                        engine: tableEngine,
                        autoIncrement: tableAutoIncrement
                    }
                );

                // Execute SQL
                await executeQuery(activeConnectionId, sql, activeDatabase || undefined, connectionType);
            }

            // Success
            toast.success(t('tableDesigner.tableCreated', 'Table created successfully'));

            // Call onSave callback to refresh sidebar
            if (onSave) {
                onSave();
            }

            // Close designer
            onClose();
        } catch (error) {
            console.error('Failed to save table:', error);
            toast.error(t('tableDesigner.saveFailed', 'Failed to save table'), String(error));
        }
    };

    return (
        <div className="flex flex-col h-full glass-strong font-sans">

            <SqlPreviewDialog
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                sql={previewSql}
                onExecute={() => {
                    toast.success(
                        isEditMode
                            ? t('tableDesigner.successAlter', 'Table updated successfully')
                            : t('tableDesigner.successCreate', 'Table created successfully')
                    );
                    onClose();
                }}
            />

            {/* Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 glass-subtle shrink-0">
                <div className="flex flex-col gap-1.5">
                    <input
                        type="text"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        disabled={isEditMode}
                        className={`bg-transparent text-2xl font-bold text-theme-primary placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-2 py-1 -ml-2 transition-all ${isEditMode ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/5'}`}
                        placeholder={t('tableDesigner.tableName')}
                    />
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-transparent text-sm text-theme-tertiary placeholder-zinc-600 focus:outline-none focus:text-theme-secondary focus:ring-1 focus:ring-indigo-500/30 rounded px-2 py-0.5 -ml-2 w-96 transition-all hover:bg-white/5"
                        placeholder={t('tableDesigner.descriptionPlaceholder')}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-theme-tertiary hover:text-theme-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                        {t('tableDesigner.discard')}
                    </button>
                    <button
                        onClick={handlePreview}
                        className="px-5 py-2.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Code2 className="w-4 h-4" />
                        {t('tableDesigner.previewSql')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!activeConnectionId || !tableName.trim() || columns.length === 0}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-500/20 disabled:shadow-none transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {t('tableDesigner.save')}
                    </button>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="flex items-center px-8 pt-1 border-b border-theme-primary bg-gradient-to-b from-theme-secondary/50 to-theme-secondary">
                {['columns', 'indexes', 'fks', 'options'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`relative px-6 py-3.5 text-sm font-semibold border-b-2 transition-all capitalize ${activeTab === tab
                            ? 'border-indigo-500 text-indigo-400 -mb-0.5'
                            : 'border-transparent text-theme-tertiary hover:text-theme-secondary hover:bg-white/5'
                            }`}
                    >
                        {tab === 'fks' ? t('tableDesigner.tabs.foreignKeys') : t(`tableDesigner.tabs.${tab}`)}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'columns' && <ColumnsTab columns={columns} setColumns={setColumns} />}
                {activeTab === 'indexes' && <IndexesTab indexes={indexes} setIndexes={setIndexes} columns={columns} />}
                {activeTab === 'fks' && (
                    <ForeignKeysTab
                        foreignKeys={foreignKeys}
                        setForeignKeys={setForeignKeys}
                        columns={columns}
                        availableTables={availableTables}
                    />
                )}
                {activeTab === 'options' && (
                    <OptionsTab
                        connectionType={connectionType}
                        charset={tableCharset}
                        collation={tableCollation}
                        engine={tableEngine}
                        autoIncrement={tableAutoIncrement}
                        onCharsetChange={setTableCharset}
                        onCollationChange={setTableCollation}
                        onEngineChange={setTableEngine}
                        onAutoIncrementChange={setTableAutoIncrement}
                    />
                )}
            </div>
        </div>
    );
};

export default TableDesigner;
