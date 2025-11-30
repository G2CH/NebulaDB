

import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTranslation } from 'react-i18next';
import {
  Files,
  Search,
  GitGraph,
  Settings,
  X,
  Database,
  Loader2,
  LayoutTemplate,
  Terminal,
  Wifi,
  WifiOff,
  Command,
  PenTool,
  Sparkles,
  Play
} from 'lucide-react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { format } from 'sql-formatter';
import {
  getDatabases,
  getTables,
  getTableStructure,
  executeScript,
  dropTable,
  dropDatabase,
  truncateTable,
  emptyTable,
  getTableInfo,
  executeQuery,
  connectToDatabase
} from './services/dbService';

import Sidebar from './components/Sidebar';
import ResultTable from './components/ResultTable';
import SqlEditor from './components/SqlEditor';
import ConnectionModal from './components/ConnectionModal';
import ExportModal from './components/ExportModal';
import TableDesigner from './components/TableDesigner/TableDesigner';
import TitleBar from './components/TitleBar';
import ToolStripe from './components/ToolStripe';
import QueryToolbar from './components/QueryToolbar';
import ToolWindow from './components/ToolWindow';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import QueryResultTable from './components/QueryResultTable';
import SettingsModal from './components/SettingsModal';
import ConfirmDialog from './components/ConfirmDialog';
import { EditorTab, QueryResult, TabType, ConnectionStatus, Connection } from './types';

import { generateSqlFromPrompt, explainQuery } from './services/geminiService';
import { MOCK_CONNECTIONS } from './constants';
import { ColumnDef } from './components/TableDesigner/types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ConsoleProvider, useConsole } from './contexts/ConsoleContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { usePanelPersistence } from './hooks/usePanelPersistence';
import { useQueryHistory } from './hooks/useQueryHistory';

// ... (other imports)

// ... (inside AppContent)





const StatusBarItem: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <div
    onClick={onClick}
    className={`px-3 flex items-center gap-1.5 hover:bg-violet-600/20 cursor-pointer transition-colors text-xs ${className}`}
  >
    {children}
  </div>
);

// --- Main App ---



// --- Main App Content ---

const AppContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
  const toast = useToast();
  const { savePanelSize, getPanelSize } = usePanelPersistence();
  const { history, addHistoryItem, clearHistory } = useQueryHistory();
  const { logs, addLog, clearLogs } = useConsole();

  // --- State ---
  const [tabs, setTabs] = useState<EditorTab[]>([
    { id: 'tab1', title: t('app.newQuery'), type: TabType.QUERY, content: '', unsavedChanges: false }
  ]);
  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem('connections');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [activeDatabase, setActiveDatabase] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>('tab1');
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);

  // Fetch databases when active connection changes
  useEffect(() => {
    const fetchDatabases = async () => {
      if (!activeConnectionId) {
        setAvailableDatabases([]);
        return;
      }
      const connection = connections.find(c => c.id === activeConnectionId);
      if (!connection) return;

      try {
        const dbs = await getDatabases(activeConnectionId, connection.type);
        setAvailableDatabases(dbs);
        // If no active database is selected, select the first one (or 'postgres'/'mysql' default if applicable)
        if (!activeDatabase && dbs.length > 0) {
          // Don't auto-select here to avoid overriding user intent, but availableDatabases will be populated
        }
      } catch (error) {
        console.error('Failed to fetch databases:', error);
      }
    };

    fetchDatabases();
  }, [activeConnectionId, connections]);

  // Persist connections
  useEffect(() => {
    localStorage.setItem('connections', JSON.stringify(connections));
  }, [connections]);

  // DO NOT auto-select connections - wait for user to explicitly connect
  // This was causing confusion where "Disconnect" appeared without actual connection
  // Removed global queryResult and isExecuting state in favor of per-tab state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'structure' | 'indexes' | 'foreignKeys' | 'info'>('structure');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

  // UI State
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportingTableName, setExportingTableName] = useState<string>('');
  const [exportingConnectionId, setExportingConnectionId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingSql, setIsGeneratingSql] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  // Designer State for Edit Mode
  const [designerColumns, setDesignerColumns] = useState<ColumnDef[] | undefined>(undefined);

  const activeTab = tabs.find(t => t.id === activeTabId);

  // --- Handlers ---

  const handleFormatSQL = () => {
    if (activeTab?.content && activeTab.type === TabType.QUERY) {
      try {
        const formatted = format(activeTab.content, {
          language: 'sql',
          keywordCase: 'upper',
          linesBetweenQueries: 2
        });
        updateTabContent(activeTabId, formatted);
        toast.success(t('app.formatSuccess', 'SQL formatted successfully'));
      } catch (error) {
        console.error('Format error:', error);
        toast.error(t('app.formatError', 'Failed to format SQL'));
      }
    }
  };

  const handleAiExplain = async () => {
    if (!activeTab?.content) return;
    setIsGeneratingSql(true);
    try {
      const explanation = await explainQuery(activeTab.content);
      toast.info(t('app.aiExplanation', 'AI Explanation'), explanation);
    } catch (error) {
      console.error('AI explanation failed:', error);
      toast.error(t('app.aiExplanationFailed', 'AI explanation failed'), String(error));
    } finally {
      setIsGeneratingSql(false);
    }
  };

  const handleRunQuery = async () => {
    if (!activeTab || activeTab.type === TabType.TABLE_DESIGNER) return;
    if (!activeConnectionId) {
      toast.warning(t('app.selectConnection', 'Please select a connection first'));
      return;
    }
    // Update tab state to executing
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isExecuting: true } : t));

    const startTime = Date.now();
    const connection = connections.find(c => c.id === activeConnectionId);

    // Apply pagination if it's a table view and pagination exists
    let queryToRun = activeTab.content;
    if (activeTab.type === TabType.TABLE_VIEW && activeTab.pagination && activeTab.metadata?.tableName) {
      // Simple check to avoid double LIMIT if user edited it
      if (!queryToRun.toLowerCase().includes('limit')) {
        queryToRun += ` LIMIT ${activeTab.pagination.limit} OFFSET ${activeTab.pagination.offset}`;
      }
    }

    addLog('info', `Executing query on ${connection?.name || 'Unknown'}`, queryToRun);

    try {
      let result: QueryResult;

      if (connection?.type === 'redis') {
        const parts = activeTab.content.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);
        const response = await import('./services/dbService').then(m => m.executeRedisCommand(activeConnectionId, command, args));

        result = {
          columns: ['Result'],
          rows: [[response]],
          executionTimeMs: Date.now() - startTime,
        };
      } else {
        result = await executeQuery(activeConnectionId, queryToRun, activeDatabase || undefined, connection?.type);
      }

      // Update tab with result
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, queryResult: result, isExecuting: false } : t));
      setBottomPanelOpen(true); // Open bottom panel to show results

      const execTime = result.executionTimeMs || (Date.now() - startTime);
      addLog('success', `Query executed successfully in ${execTime}ms`, `${result.rows?.length || 0} rows returned`);

      // Add to history
      addHistoryItem({
        query: activeTab.content,
        status: 'success',
        executionTimeMs: execTime,
        connectionName: connection?.name,
        rowCount: result.rows?.length
      });
    } catch (e) {
      console.error(e);
      const errorResult = {
        columns: [t('app.error')],
        rows: [[String(e)]],
        executionTimeMs: Date.now() - startTime,
        error: String(e)
      };
      console.log('[DEBUG] Final result columns:', errorResult.columns?.length || 0, 'rows:', errorResult.rows?.length || 0);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, queryResult: errorResult, isExecuting: false } : t));
      setBottomPanelOpen(true); // Open bottom panel to show error

      addLog('error', 'Query execution failed', String(e));

      // Add to history with error status
      addHistoryItem({
        query: queryToRun,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        connectionName: connection?.name
      });
    }
  };

  const handleRerunQuery = (query: string) => {
    if (activeTab) {
      updateTabContent(activeTab.id, query);
      // Run query after a short delay to allow content to update
      setTimeout(() => handleRunQuery(), 100);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !activeConnectionId) return;

    setIsGeneratingSql(true);
    try {
      const { generateSqlFromPrompt } = await import('./services/geminiService');
      const connection = connections.find(c => c.id === activeConnectionId);

      const generatedSql = await generateSqlFromPrompt({
        connectionId: activeConnectionId,
        database: activeDatabase,
        connectionType: connection?.type || 'postgres',
        userPrompt: aiPrompt
      });

      if (activeTab) {
        updateTabContent(activeTab.id, generatedSql);
      }
      setShowAiInput(false);
      setAiPrompt('');
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error(t('app.aiGenerationFailed', 'AI generation failed'), String(error));
    } finally {
      setIsGeneratingSql(false);
    }
  };



  const updateTabContent = (id: string, content: string | undefined) => {
    if (content === undefined) return;
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content, unsavedChanges: true } : t));
  };

  const executeTableQuery = async (tabId: string, tableName: string, database: string, limit: number, offset: number, connectionId?: string) => {
    const connId = connectionId || activeConnectionId;
    console.log('[DEBUG] executeTableQuery START');
    console.log('  - tabId:', tabId);
    console.log('  - tableName:', tableName);
    console.log('  - database:', database);
    console.log('  - providedConnectionId:', connectionId);
    console.log('  - activeConnectionId:', activeConnectionId);
    console.log('  - finalConnId:', connId);

    if (!connId) {
      console.warn('[DEBUG] No connection ID available in executeTableQuery');
      return;
    }

    const connection = connections.find(c => c.id === connId);
    let sql = `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`;

    // For MySQL, use fully qualified name to ensure we query the right database
    if (connection?.type === 'mysql' && database) {
      sql = `SELECT * FROM \`${database}\`.\`${tableName}\` LIMIT ${limit} OFFSET ${offset}`;
    }

    // Update tab to executing state
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isExecuting: true } : t));

    try {
      let result = await executeQuery(connId, sql, database, connection?.type);
      console.log('[DEBUG] Query executed, result columns:', result.columns?.length || 0, 'rows:', result.rows?.length || 0);

      // If result is empty (no columns), try to fetch table structure to show headers
      if (result.columns.length === 0 && result.rows.length === 0) {
        console.log('[DEBUG] Empty result, fetching table structure...');
        try {
          const structure = await getTableStructure(connId, tableName, database, connection?.type);
          console.log('[DEBUG] Structure fetched, columns:', structure?.length || 0);
          if (structure && structure.length > 0) {
            result = {
              ...result,
              columns: structure.map(col => col.name)
            };
            console.log('[DEBUG] Updated result.columns:', result.columns);
          } else {
            console.warn('[DEBUG] No structure returned');
          }
        } catch (err) {
          console.error('Failed to fetch table structure for empty result:', err);
        }
      }

      console.log('[DEBUG] Final result columns:', result.columns?.length || 0, 'rows:', result.rows?.length || 0);
      setTabs(prev => prev.map(t =>
        t.id === tabId
          ? {
            ...t,
            queryResult: result,
            isExecuting: false,
            pagination: { ...t.pagination!, offset }
          }
          : t
      ));
    } catch (e) {
      console.error(e);
      const errorResult = {
        columns: ['Error'],
        rows: [[String(e)]],
        executionTimeMs: 0,
        error: String(e)
      };
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, queryResult: errorResult, isExecuting: false } : t));
    }
  };

  const handlePageChange = (newOffset: number) => {
    if (!activeTab || !activeTab.pagination || !activeTab.metadata?.tableName) return;

    executeTableQuery(
      activeTab.id,
      activeTab.metadata.tableName,
      activeTab.metadata.database || activeDatabase || 'postgres',
      activeTab.pagination.limit,
      newOffset,
      activeConnectionId || undefined
    );
  };

  const closeTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const openTableTab = (tableName: string, databaseName?: string, connectionId?: string) => {
    setRightPanelOpen(true);
    setSelectedTable(tableName);

    // Use provided connectionId or fall back to activeConnectionId
    const connId = connectionId || activeConnectionId;
    console.log('[DEBUG] openTableTab called:', {
      tableName,
      databaseName,
      providedConnectionId: connectionId,
      activeConnectionId,
      finalConnId: connId
    });

    // Check if tab already exists
    const existingTab = tabs.find(t => t.associatedTable === tableName && t.metadata?.database === (databaseName || activeDatabase));
    if (existingTab) {
      setActiveTabId(existingTab.id);
      // Re-execute query if connection is available
      if (connId && existingTab.queryResult === undefined) {
        executeTableQuery(
          existingTab.id,
          tableName,
          databaseName || activeDatabase || 'postgres',
          existingTab.pagination?.limit || 100,
          existingTab.pagination?.offset || 0,
          connId
        );
      }
      return;
    }

    if (databaseName) {
      setActiveDatabase(databaseName);
    }

    // Set active connection if provided
    if (connectionId && connectionId !== activeConnectionId) {
      setActiveConnectionId(connectionId);
    }

    const sql = `SELECT * FROM ${tableName} LIMIT 100;`;
    const newTab: EditorTab = {
      id: `table_${tableName}_${Date.now()}`,
      title: tableName,
      type: TabType.TABLE_VIEW,
      content: `SELECT * FROM ${tableName}`,
      unsavedChanges: false,
      associatedTable: tableName,
      metadata: { database: databaseName || activeDatabase, tableName }, // Store tableName for pagination logic
      pagination: {
        limit: 100,
        offset: 0
      }
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);

    // Auto-execute query for data preview
    if (connId) {
      console.log('[DEBUG] Calling executeTableQuery with connId:', connId);
      executeTableQuery(
        newTab.id,
        tableName,
        databaseName || activeDatabase || 'postgres',
        100,
        0,
        connId
      );
    } else {
      // If no connection, just stop executing state
      setTabs(prev => prev.map(t => t.id === newTab.id ? { ...t, isExecuting: false } : t));
    }
  };

  const openTableDesigner = async (tableName: string, connectionId?: string, databaseName?: string) => {
    const connId = connectionId || activeConnectionId;
    const dbName = databaseName || activeDatabase;

    console.log('[DEBUG] openTableDesigner called with:', { tableName, connId, dbName });
    if (!connId) {
      toast.error(t('app.selectConnectionFirst', 'Please select a connection first.'));
      return;
    }

    try {
      const connection = connections.find(c => c.id === connId);
      const structure = await getTableStructure(connId, tableName, dbName || undefined, connection?.type);
      console.log('[DEBUG] Got structure:', structure);

      // Transform to ColumnDef format
      const columns: ColumnDef[] = structure.map((col, idx) => ({
        id: col.id || `col_${idx}`,
        status: 'clean' as const,
        name: col.name,
        type: col.type,
        length: col.length || '',
        isPrimaryKey: col.isPrimaryKey || false,
        isNotNull: col.isNotNull || false,
        isAutoIncrement: col.isAutoIncrement || false,
        defaultValue: col.defaultValue || '',
        comment: col.comment || ''
      }));

      setDesignerColumns(columns);
      setSelectedTable(tableName);

      const newTab: EditorTab = {
        id: `designer_${Date.now()}`,
        title: `Design: ${tableName}`,
        type: TabType.TABLE_DESIGNER,
        content: '',
        unsavedChanges: false,
        metadata: {
          tableName,
          database: dbName || undefined,
          connectionType: connection?.type
        }
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    } catch (error) {
      console.error('Failed to load table structure:', error);
      toast.error(t('app.loadTableFailed', 'Failed to load table structure'), String(error));
    }
  };

  const handleExport = (tableName: string, connectionId?: string) => {
    setExportingTableName(tableName);
    if (connectionId) {
      setExportingConnectionId(connectionId);
    } else {
      setExportingConnectionId(activeConnectionId);
    }
    setIsExportModalOpen(true);
  };

  const createNewQuery = () => {
    const newTab: EditorTab = {
      id: `tab_${Date.now()}`,
      title: t('app.newQuery'),
      type: TabType.QUERY,
      content: '',
      unsavedChanges: false
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleTruncateTable = (tableName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirmDialog.truncateTable'),
      message: t('confirmDialog.truncateMessage', { tableName }),
      onConfirm: async () => {
        if (!activeConnectionId) return;
        const connection = connections.find(c => c.id === activeConnectionId);
        addLog('info', `Truncating table ${tableName}`);
        try {
          // Use strict truncateTable which uses TRUNCATE TABLE statement
          await truncateTable(activeConnectionId, tableName, connection?.type);
          addLog('success', `Table ${tableName} truncated successfully`);
          toast.success(t('app.truncateSuccess', 'Table truncated successfully'));
        } catch (error) {
          addLog('error', `Failed to truncate table ${tableName}`, String(error));
          toast.error(t('app.truncateFailed', 'Failed to truncate table'), String(error));
        }
      }
    });
  };

  const handleEmptyTable = (tableName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirmDialog.emptyTable'),
      message: t('confirmDialog.emptyMessage', { tableName }),
      onConfirm: async () => {
        if (!activeConnectionId) return;
        addLog('info', `Emptying table ${tableName}`);
        try {
          // Use emptyTable which uses DELETE FROM statement
          await emptyTable(activeConnectionId, tableName);
          addLog('success', `Table ${tableName} emptied successfully`);
          toast.success(t('app.emptySuccess', 'Table emptied successfully'));
        } catch (error) {
          addLog('error', `Failed to empty table ${tableName}`, String(error));
          toast.error(t('app.emptyFailed', 'Failed to empty table'), String(error));
        }
      }
    });
  };

  const handleDropTable = (tableName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirmDialog.dropTable'),
      message: t('confirmDialog.dropMessage', { tableName }),
      onConfirm: async () => {
        if (!activeConnectionId) return;
        const connection = connections.find(c => c.id === activeConnectionId);
        addLog('info', `Dropping table ${tableName}`);
        try {
          await executeQuery(activeConnectionId, `DROP TABLE ${tableName}`, undefined, connection?.type);
          addLog('success', `Table ${tableName} dropped successfully`);
        } catch (error) {
          addLog('error', `Failed to drop table ${tableName}`, String(error));
          toast.error(t('app.dropFailed', 'Failed to drop table'), String(error));
        }
      }
    });
  };

  const handleGenerateSQL = async (tableName: string, type: string, connectionId?: string, databaseName?: string) => {
    const connId = connectionId || activeConnectionId;
    const dbName = databaseName || activeDatabase;

    if (!connId) {
      toast.error(t('app.noConnection', 'No active connection'));
      return;
    }

    try {
      const connection = connections.find(c => c.id === connId);
      let sql = '';

      if (type === 'select') {
        if (connection?.type === 'mysql' && dbName) {
          sql = `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 1000;`;
        } else {
          sql = `SELECT * FROM ${tableName} LIMIT 1000;`;
        }
      } else {
        const structure = await getTableStructure(connId, tableName, dbName || undefined, connection?.type);
        const columns = structure.map(c => c.name);
        // Heuristic for PK if not found (Postgres implementation in getTableStructure is incomplete)
        const pk = structure.find(c => c.isPrimaryKey)?.name || 'id';
        const fullTableName = (connection?.type === 'mysql' && dbName) ? `\`${dbName}\`.\`${tableName}\`` : tableName;

        switch (type) {
          case 'insert':
            const cols = columns.join(', ');
            const valPlaceholders = columns.map(c => `<${c}>`).join(', ');
            sql = `INSERT INTO ${fullTableName} (${cols}) VALUES (${valPlaceholders});`;
            break;
          case 'update':
            const setClause = columns.filter(c => c !== pk).map(c => `${c} = <value>`).join(',\n  ');
            sql = `UPDATE ${fullTableName}\nSET ${setClause}\nWHERE ${pk} = <value>;`;
            break;
          case 'delete':
            sql = `DELETE FROM ${fullTableName}\nWHERE ${pk} = <value>;`;
            break;
          case 'create':
            const colDefs = structure.map(c => {
              let def = `${c.name} ${c.type}`;
              if (c.length && (c.type.toLowerCase().includes('char') || c.type.toLowerCase().includes('binary'))) {
                def += `(${c.length})`;
              }
              if (c.isPrimaryKey) def += ' PRIMARY KEY';
              if (c.isNotNull) def += ' NOT NULL';
              if (c.isAutoIncrement && connection?.type === 'mysql') def += ' AUTO_INCREMENT';
              if (c.defaultValue) def += ` DEFAULT ${c.defaultValue === 'CURRENT_TIMESTAMP' ? 'CURRENT_TIMESTAMP' : `'${c.defaultValue}'`}`;
              if (c.comment) def += ` COMMENT '${c.comment}'`;
              return def;
            }).join(',\n  ');

            let tableOptions = '';
            if (connection?.type === 'mysql') {
              try {
                const { getTableInfo } = await import('./services/dbService');
                const info = await getTableInfo(connId, tableName, dbName || undefined, connection?.type);
                if (info.engine && info.engine !== '-') tableOptions += ` ENGINE=${info.engine}`;
                if (info.collation && info.collation !== '-') tableOptions += ` COLLATE=${info.collation}`;
                // Note: getTableInfo type definition needs update to include comment, but for now we can cast or update it
                if (info.comment) tableOptions += ` COMMENT='${info.comment}'`;
              } catch (e) {
                console.error('Failed to fetch table info for options', e);
              }
            }

            sql = `CREATE TABLE ${fullTableName} (\n  ${colDefs}\n)${tableOptions};`;
            break;
        }
      }

      await writeText(sql);
      addLog('success', `Generated SQL copied to clipboard`, sql);
      toast.success(t('app.sqlGenerated', 'SQL copied to clipboard'));

    } catch (error) {
      console.error('Failed to generate SQL', error);
      toast.error(t('app.generateSqlFailed', 'Failed to generate SQL'), String(error));
    }
  };

  const handleTableSaved = () => {
    addLog('success', 'Table saved successfully');
    // Sidebar refresh is handled by onSave callback
  };

  const handleSaveConnection = (connection: Connection) => {
    setConnections(prev => {
      const exists = prev.find(c => c.id === connection.id);
      if (exists) {
        return prev.map(c => c.id === connection.id ? connection : c);
      }
      return [...prev, connection];
    });
    setActiveConnectionId(connection.id);
    addLog('success', `Connected to ${connection.name}`);
    setIsConnectionModalOpen(false);
    setEditingConnection(null);
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    if (activeConnectionId === id) {
      setActiveConnectionId(null);
      setActiveDatabase(null);
    }
    addLog('info', 'Connection deleted');
    setIsConnectionModalOpen(false);
    setEditingConnection(null);
  };

  const handleDisconnect = () => {
    if (activeConnectionId) {
      // Update connection status to DISCONNECTED
      setConnections(prev => prev.map(c =>
        c.id === activeConnectionId
          ? { ...c, status: ConnectionStatus.DISCONNECTED }
          : c
      ));
      setActiveConnectionId(null);
      setActiveDatabase(null);
      addLog('info', 'Disconnected');
      toast.info(t('app.disconnected', 'Disconnected'));
    }
  };

  const openEditConnection = (conn: Connection) => {
    setEditingConnection(conn);
    setIsConnectionModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans selection:bg-violet-500/30 bg-zinc-950 text-theme-primary">

      {/* Modal Layer */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onSave={handleSaveConnection}
        onDelete={handleDeleteConnection}
        initialConnection={editingConnection}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tableName={exportingTableName}
        connectionId={exportingConnectionId || activeConnectionId}
        connectionType={connections.find(c => c.id === (exportingConnectionId || activeConnectionId))?.type}
        currentQuery={activeTab?.content}
        pagination={activeTab?.pagination}
        databaseName={activeDatabase}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />



      {/* Custom TitleBar */}
      <TitleBar
        onSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Workspace with ToolStripes and Resizable Panels */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Tool Stripe */}
        <ToolStripe
          side="left"
          items={[
            {
              id: 'database',
              icon: Database,
              label: 'Database',
              isActive: sidebarVisible,
              onClick: () => setSidebarVisible(!sidebarVisible)
            }
          ]}
          bottomItems={[
            {
              id: 'services',
              icon: Terminal,
              label: 'Services',
              isActive: bottomPanelOpen,
              onClick: () => setBottomPanelOpen(!bottomPanelOpen)
            }
          ]}
        />

        {/* Resizable Panels Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <PanelGroup direction="vertical">
            <Panel id="main-horizontal" order={1} className="flex flex-col min-h-0">
              <PanelGroup direction="horizontal">

                {/* Left Sidebar Panel */}
                {sidebarVisible && (
                  <>
                    <Panel
                      id="sidebar"
                      order={1}
                      defaultSize={20}
                      minSize={15}
                      maxSize={30}
                      className="flex flex-col border-r border-theme-primary"
                    >
                      <ToolWindow
                        title={t('app.database')}
                        isOpen={true}
                        side="left"
                        onClose={() => setSidebarVisible(false)}
                        hideHeader={true}
                        className="h-full"
                      >
                        <Sidebar
                          connections={connections}
                          activeConnectionId={activeConnectionId}
                          activeDatabase={activeDatabase}
                          onSelectTable={openTableTab}
                          onSelectDatabase={(dbName, connId) => {
                            setActiveDatabase(dbName);
                            if (connId) setActiveConnectionId(connId);
                          }}
                          onSelectConnection={(connId) => {
                            setActiveConnectionId(connId);
                            // When selecting a connection, we might want to clear the active database
                            // or keep it if it belongs to this connection. For simplicity, let's clear it
                            // unless it's already set to a db in this connection (which we can't easily check here without more logic)
                            // A safer bet is to clear it to force user to select a DB or let auto-select handle it
                            setActiveDatabase(null);
                          }}
                          onNewConnection={() => {
                            setEditingConnection(null);
                            setIsConnectionModalOpen(true);
                          }}
                          onEditConnection={openEditConnection}
                          onExport={(tableName, connectionId) => {
                            setExportingTableName(tableName);
                            setExportingConnectionId(connectionId || activeConnectionId);
                            setIsExportModalOpen(true);
                          }}
                          onCreateTable={(dbName, connectionType) => {
                            setSelectedTable(null);
                            setDesignerColumns(undefined);
                            const newTab: EditorTab = {
                              id: `designer_${Date.now()}`,
                              title: t('app.newTable'),
                              type: TabType.TABLE_DESIGNER,
                              content: '',
                              unsavedChanges: false,
                              metadata: { database: dbName, connectionType }
                            };
                            setTabs(prev => [...prev, newTab]);
                            setActiveTabId(newTab.id);
                          }}
                          onDesignTable={openTableDesigner}
                          onTruncateTable={handleTruncateTable}
                          onEmptyTable={handleEmptyTable}
                          onDropTable={handleDropTable}
                          onDropDatabase={async (dbName) => {
                            if (!activeConnectionId) return;
                            if (await confirm(t('app.confirmDropDatabase', 'Are you sure you want to drop database {{name}}?', { name: dbName }))) {
                              try {
                                const connection = connections.find(c => c.id === activeConnectionId);
                                await dropDatabase(activeConnectionId, dbName, connection?.type);
                                toast.success(t('app.databaseDropped', 'Database dropped successfully'));
                                // Refresh connection to show updated database list
                                // We might need to select another database if the current one was dropped
                                if (activeDatabase === dbName) {
                                  setActiveDatabase(null);
                                }
                                // Trigger refresh of the connection node in sidebar if possible, 
                                // or just let the user refresh manually for now, or we can reload connections
                              } catch (error) {
                                console.error('Failed to drop database:', error);
                                toast.error(t('app.dropDatabaseFailed', 'Failed to drop database'), String(error));
                              }
                            }
                          }}
                          onGenerateSQL={handleGenerateSQL}
                          onDisconnect={handleDisconnect}
                          onDeleteConnection={handleDeleteConnection}
                        />
                      </ToolWindow>
                    </Panel>
                    <PanelResizeHandle className="w-[2px] hover:bg-violet-500 transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }} />
                  </>
                )}

                {/* Center Area (Editor) */}
                <Panel
                  id="center"
                  order={2}
                  defaultSize={55}
                  minSize={40}
                  className="flex flex-col min-w-0"
                >
                  {/* Editor Panel */}
                  <div className="flex flex-col h-full min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    {/* Tabs Header */}
                    <div className="h-8 flex items-center overflow-x-auto no-scrollbar border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderBottomColor: 'var(--glass-border)' }}>
                      {tabs.map(tab => (
                        <div
                          key={tab.id}
                          onClick={() => setActiveTabId(tab.id)}
                          className="h-full px-3 flex items-center gap-2 border-r cursor-pointer text-xs font-medium transition-colors whitespace-nowrap group"
                          style={{
                            backgroundColor: activeTabId === tab.id ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                            color: activeTabId === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            borderRightColor: 'var(--glass-border)'
                          }}
                          onMouseEnter={(e) => { if (activeTabId !== tab.id) { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                          onMouseLeave={(e) => { if (activeTabId !== tab.id) { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-tertiary)'; } }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {tab.type === TabType.TABLE_DESIGNER ? (
                              <PenTool className="w-3 h-3 text-violet-400" />
                            ) : (
                              <Database className={`w-3 h-3 ${tab.type === TabType.TABLE_VIEW ? 'text-blue-400' : 'text-yellow-500'}`} />
                            )}
                            <span className={`truncate ${tab.unsavedChanges ? 'italic' : ''}`}>{tab.title}</span>
                          </div>
                          <button
                            onClick={(e) => closeTab(tab.id, e)}
                            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded ${activeTabId === tab.id ? 'opacity-100' : ''}`}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={createNewQuery}
                        className="h-full px-3 flex items-center justify-center transition-colors border-r"
                        style={{ color: 'var(--text-tertiary)', borderRightColor: 'var(--glass-border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                        title={t('app.newQuery')}
                      >
                        <span className="text-lg leading-none">+</span>
                      </button>
                    </div>

                    {/* Content Area */}
                    {activeTab?.type === TabType.TABLE_DESIGNER ? (
                      <TableDesigner
                        initialTableName={activeTab.title.replace('Design: ', '') === 'New Table' ? '' : activeTab.title.replace('Design: ', '')}
                        initialColumns={designerColumns}
                        onClose={() => closeTab(activeTab.id)}
                        onSave={handleTableSaved}
                        activeConnectionId={activeConnectionId}
                        activeDatabase={activeTab.metadata?.database}
                        connectionType={activeTab.metadata?.connectionType}
                      />
                    ) : activeTab?.type === TabType.TABLE_VIEW ? (
                      <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <ResultTable
                          data={activeTab.queryResult || null}
                          isLoading={!!activeTab.isExecuting}
                          pagination={activeTab.pagination}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <PanelGroup direction="vertical">
                          <Panel id="sql-editor" order={1} defaultSize={50} minSize={20} className="flex flex-col min-h-0">
                            <QueryToolbar
                              isExecuting={activeTab?.isExecuting || false}
                              onExecute={handleRunQuery}
                              onStop={() => {
                                // TODO: Implement stop query
                                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isExecuting: false } : t));
                              }}
                              onFormat={handleFormatSQL}
                              onHistory={() => setBottomPanelOpen(true)}
                              connections={connections}
                              selectedConnectionId={activeConnectionId}
                              onSelectConnection={(connId) => {
                                setActiveConnectionId(connId);
                                setActiveDatabase(null);
                              }}
                              databases={availableDatabases}
                              selectedDatabase={activeDatabase || ''}
                              onSelectDatabase={(db) => {
                                setActiveDatabase(db);
                                addLog('info', `Switched to database: ${db}`);
                              }}
                            />
                            {/* AI Input */}
                            {showAiInput && (
                              <div className="p-4 border-b space-y-3" style={{ borderBottomColor: 'var(--glass-border)', backgroundColor: 'var(--bg-secondary)' }}>
                                <div className="flex items-start gap-3">
                                  <Sparkles className="w-5 h-5 text-indigo-400 mt-1" />
                                  <div className="flex-1 space-y-2">
                                    <input
                                      type="text"
                                      value={aiPrompt}
                                      onChange={(e) => setAiPrompt(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && !isGeneratingSql && aiPrompt && handleAiGenerate()}
                                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                                      placeholder={t('app.aiPlaceholder')}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setShowAiInput(false)}
                                        className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
                                      >
                                        {t('app.cancel')}
                                      </button>
                                      <button
                                        onClick={handleAiGenerate}
                                        disabled={isGeneratingSql || !aiPrompt}
                                        className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/30 text-violet-400 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isGeneratingSql ? 'Generating...' : 'Generate SQL'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex-1 overflow-hidden">
                              <SqlEditor
                                value={activeTab?.content || ''}
                                onChange={(val) => activeTab && updateTabContent(activeTab.id, val)}
                              />
                            </div>
                          </Panel>
                        </PanelGroup>
                      </div>
                    )}
                  </div>
                </Panel>

                {/* Right Sidebar Panel - Resizable */}
                {rightPanelOpen && (
                  <>
                    <PanelResizeHandle className="w-1 bg-theme-primary hover:bg-violet-500 transition-colors border-l border-r border-theme-secondary" />
                    <Panel
                      id="right"
                      order={3}
                      defaultSize={25}
                      minSize={15}
                      maxSize={40}
                      className="flex flex-col overflow-hidden"
                    >
                      <RightPanel
                        isOpen={true}
                        activeTab={rightPanelTab}
                        setActiveTab={setRightPanelTab}
                        tableName={selectedTable}
                        connectionId={activeConnectionId}
                        database={activeDatabase}
                        connectionType={connections.find(c => c.id === activeConnectionId)?.type}
                        onClose={() => setRightPanelOpen(false)}
                      />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {/* Bottom Panel (Full Width) */}
            {bottomPanelOpen && (
              <>
                <PanelResizeHandle className="h-[2px] hover:bg-violet-500 transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }} />
                <Panel id="bottom" order={2} defaultSize={getPanelSize('bottomPanel', 30)} minSize={10} className="flex flex-col border-t border-theme-primary" onResize={(size) => savePanelSize('bottomPanel', size)}>
                  <BottomPanel
                    isOpen={true}
                    onToggle={() => setBottomPanelOpen(false)}
                    queryResult={activeTab?.type === TabType.QUERY ? (activeTab?.queryResult || null) : null}
                    isExecuting={activeTab?.type === TabType.QUERY ? (activeTab?.isExecuting || false) : false}
                    history={history}
                    onRerunQuery={handleRerunQuery}
                    onClearHistory={clearHistory}
                    logs={logs}
                    onClearLogs={clearLogs}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>

        {/* Right Tool Stripe */}
        <ToolStripe
          side="right"
          items={[
            {
              id: 'details',
              icon: LayoutTemplate,
              label: 'Table Details',
              isActive: rightPanelOpen,
              onClick: () => setRightPanelOpen(!rightPanelOpen)
            }
          ]}
        />

      </div>

      {/* Status Bar */}
      <div className="h-6 border-t flex items-center justify-between px-2 select-none text-[11px] font-medium" style={{ backgroundColor: 'var(--bg-secondary)', borderTopColor: 'var(--glass-border)', color: 'var(--text-tertiary)' }}>
        <div className="flex items-center">
          <StatusBarItem>
            <LayoutTemplate className="w-3 h-3" />
            <span>main</span>
          </StatusBarItem>
          <StatusBarItem>
            <Terminal className="w-3 h-3" />
            <span>0 Errors</span>
          </StatusBarItem>
        </div>
        <div className="flex items-center">
          <StatusBarItem>
            <span>Ln 1, Col 1</span>
          </StatusBarItem>
          <StatusBarItem>
            <span>UTF-8</span>
          </StatusBarItem>
          <StatusBarItem className="" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            {activeConnectionId ? (
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3" />
                <span>{t('app.connected', { host: connections.find(c => c.id === activeConnectionId)?.host || 'Unknown' })}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-3 h-3" />
                <span>{t('app.disconnected')}</span>
              </div>
            )}
          </StatusBarItem>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
      />

    </div >
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConsoleProvider>
          <AppContent />
        </ConsoleProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
