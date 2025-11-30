
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  ChevronDown,
  Database,
  Table2,
  Server,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  FileCode,
  ExternalLink,
  Download,
  FilePlus,
  PenTool,
  Loader2,
  RefreshCw,
  Unplug,
  Settings
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ui/ContextMenu';
import { Connection, ConnectionStatus } from '../types';
import { getDatabases, getTables, connectToDatabase } from '../services/dbService';
import { buildConnectionString } from '../utils/connectionUtils';

// --- Types ---

type NodeType = 'connection' | 'database' | 'table';

interface TreeNode {
  id: string;
  name: string;
  type: NodeType;
  children?: TreeNode[];
  parentId?: string; // To track hierarchy for queries
  connectionId?: string; // Root connection ID
  isLoading?: boolean;
  isLoaded?: boolean; // To prevent re-fetching
  data?: any; // To store additional data like connection object or database name for tables
}

interface SidebarProps {
  connections: Connection[];
  activeConnectionId?: string | null;
  activeDatabase?: string | null;
  onSelectTable: (tableName: string, databaseName?: string, connectionId?: string) => void;
  onSelectDatabase?: (databaseName: string, connectionId?: string) => void;
  onSelectConnection?: (connectionId: string) => void;
  onNewConnection: () => void;
  onEditConnection: (connection: Connection) => void;
  onExport: (tableName: string, connectionId?: string) => void;
  onCreateTable: (databaseName: string) => void;
  onDesignTable: (tableName: string, connectionId?: string, databaseName?: string) => void;
  onTruncateTable: (tableName: string) => void;
  onDropTable: (tableName: string) => void;
  onGenerateSQL: (tableName: string, type: string, connectionId?: string, databaseName?: string) => void;
  onDisconnect: () => void;
  onDeleteConnection: (id: string) => void;
}

// --- Components ---

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (node: TreeNode) => void;
  onSelect: (node: TreeNode) => void;
  onSelectTable: (name: string, databaseName?: string, connectionId?: string) => void;
  onExport?: (name: string, connectionId?: string) => void;
  onCreateTable?: (dbName: string, connectionType?: string) => void;
  onDesignTable?: (tableName: string, connectionId?: string, databaseName?: string) => void;
  onRefresh?: (node: TreeNode) => void;
  onTruncateTable?: (tableName: string) => void;
  onEmptyTable?: (tableName: string) => void;
  onDropTable?: (tableName: string) => void;
  onDropDatabase?: (databaseName: string) => void;
  onGenerateSQL?: (tableName: string, type: string, connectionId?: string, databaseName?: string) => void;
  onEditConnection?: (connection: any) => void; // Added
  onNewConnection?: () => void; // Added for connection context menu
  isActive?: boolean; // Added
  activeConnectionId?: string | null; // Added
  onDisconnect?: () => void; // Added
  onDeleteConnection?: (id: string) => void; // Added
  setSelectedId: (id: string | null) => void; // Added for double-click handling
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onSelectTable,
  onExport,
  onCreateTable,
  onDesignTable,
  onRefresh,
  onTruncateTable,
  onEmptyTable,
  onDropTable,
  onDropDatabase,
  onGenerateSQL,
  onEditConnection, // Added
  onNewConnection, // Added
  isActive, // Added
  activeConnectionId, // Added
  onDisconnect, // Added
  onDeleteConnection, // Added
  setSelectedId // Added for double-click
}) => {
  const { t } = useTranslation();
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isLoading = node.isLoading;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only select the node, don't open table preview on single click
    setSelectedId(node.id);
    // Toggle expansion for non-leaf nodes
    if (node.type !== 'table') {
      onToggle(node);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open table preview on double-click
    if (node.type === 'table') {
      onSelect(node);
    }
  };

  // Icon selection based on type
  const getIcon = () => {
    if (isLoading) return <Loader2 className="w-3.5 h-3.5 animate-spin text-theme-tertiary" />;
    switch (node.type) {
      case 'connection': return <Server className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-theme-tertiary'}`} />;
      case 'database': return <Database className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : (isSelected ? 'text-indigo-400' : 'text-theme-tertiary')}`} />;
      case 'table': return <Table2 className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-blue-400/80'}`} />;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="px-2 py-1 text-xs leading-relaxed border-l-2 rounded-sm transition-all group flex items-center gap-1.5 pr-2 cursor-pointer select-none"
            style={{
              backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : (isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)'),
              borderLeftColor: isActive ? '#10b981' : (isSelected ? '#8b5cf6' : 'transparent'),
              paddingLeft: `${depth * 12 + 8}px`,
              fontWeight: isActive ? 600 : 400
            }}
            onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; } }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            {/* Expand/Collapse Arrow */}
            <span className="flex items-center justify-center w-4 h-4 text-zinc-600 hover:text-zinc-400">
              {node.type !== 'table' ? (
                isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3" />
              )}
            </span>


            {/* Node Icon */}
            {getIcon()}

            {/* Label */}
            <span className="truncate">{node.name}</span>

            {/* Connection Status Indicator */}
            {node.type === 'connection' && node.data && (
              <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${node.data.status === 'CONNECTED'
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-zinc-500 bg-zinc-500/10'
                }`}>
                {node.data.status === 'CONNECTED' ? '●' : '○'}
              </span>
            )}
            {isActive && <span className="ml-auto text-[10px] text-emerald-500 font-medium px-1.5 py-0.5 bg-emerald-500/10 rounded">Active</span>}
          </div>
        </ContextMenuTrigger>

        {/* Context Menu Content */}
        <ContextMenuContent>
          {node.type === 'connection' && (
            <>
              <ContextMenuItem onClick={() => onEditConnection && node.data && onEditConnection(node.data)}>
                <Settings className="w-3.5 h-3.5 mr-2" />
                {t('sidebar.editConnection')}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onRefresh && onRefresh(node)}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                {t('sidebar.refresh')}
              </ContextMenuItem>

              {activeConnectionId === node.id && (
                <ContextMenuItem onClick={() => onDisconnect && onDisconnect()}>
                  <Unplug className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  {t('sidebar.disconnect', 'Disconnect')}
                </ContextMenuItem>
              )}

              <ContextMenuSeparator />

              <ContextMenuItem onClick={onNewConnection}>
                <Plus className="w-3.5 h-3.5 mr-2" />
                {t('sidebar.newConnection')}
              </ContextMenuItem>

              <ContextMenuItem
                onClick={() => {
                  if (confirm(t('sidebar.confirmDelete', 'Are you sure you want to delete this connection?'))) {
                    onDeleteConnection && onDeleteConnection(node.id);
                  }
                }}
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                {t('sidebar.deleteConnection', 'Delete Connection')}
              </ContextMenuItem>
            </>
          )}

          {node.type === 'database' && (
            <>
              <ContextMenuItem onClick={() => onSelect(node)}>
                <Database className="w-3.5 h-3.5 mr-2" />
                {t('sidebar.useDatabase')}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => {
                const connection = node.connectionId ? node.data : null;
                // Note: node.data for database node might not be connection object. 
                // We need to find connection type.
                // Actually node.connectionId is available.
                // But we don't have access to connections array here easily unless we pass it down or find it.
                // Wait, Sidebar has connections. TreeItem does not.
                // We can pass connectionType down to TreeItem or find it in onSelect handler in Sidebar.
                // But this is onClick in TreeItem.

                // Let's just pass the callback and let Sidebar handle the lookup?
                // No, Sidebar passes the handler to TreeItem.

                // Better: Pass connectionType to TreeItem.
                // We can add connectionType to TreeNode or pass it as prop.
                // Let's use onCreateTable(node.name, node.data?.connectionType) if we store it.

                onCreateTable && onCreateTable(node.name);
              }}>
                <FilePlus className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.createTable')}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onRefresh && onRefresh(node)}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.refresh')}
              </ContextMenuItem>
            </>
          )}

          {node.type === 'table' && (
            <>
              <ContextMenuItem className="font-semibold text-zinc-100" onClick={() => onSelectTable(node.name, node.data?.databaseName)}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.openTable')}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDesignTable && onDesignTable(node.name, node.connectionId, node.data?.databaseName)}>
                <PenTool className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.designTable')}
              </ContextMenuItem>
            </>
          )}

          <ContextMenuItem onClick={() => handleCopy(node.name)}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            {t('sidebar.copyName')}
          </ContextMenuItem>

          <ContextMenuSeparator />

          {node.type === 'table' && (
            <>
              <ContextMenuItem onClick={() => onExport && onExport(node.name, node.connectionId)}>
                <Download className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.exportData')}
              </ContextMenuItem>

              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FileCode className="mr-2 h-3.5 w-3.5" />
                  {t('sidebar.generateSql')}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onClick={() => onGenerateSQL && onGenerateSQL(node.name, 'select', node.connectionId, node.data?.databaseName)}>
                    {t('sidebar.selectAll')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onGenerateSQL && onGenerateSQL(node.name, 'insert', node.connectionId, node.data?.databaseName)}>
                    {t('sidebar.insertScript')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onGenerateSQL && onGenerateSQL(node.name, 'create', node.connectionId, node.data?.databaseName)}>
                    {t('sidebar.createStatement')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onGenerateSQL && onGenerateSQL(node.name, 'update', node.connectionId, node.data?.databaseName)}>
                    {t('sidebar.updateStatement')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onGenerateSQL && onGenerateSQL(node.name, 'delete', node.connectionId, node.data?.databaseName)}>
                    {t('sidebar.deleteStatement')}
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSeparator />

              <ContextMenuItem onClick={() => onTruncateTable && onTruncateTable(node.name)}>
                <Database className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.truncateTable')}
              </ContextMenuItem>

              <ContextMenuItem onClick={() => onEmptyTable && onEmptyTable(node.name)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t('sidebar.emptyTable')}
              </ContextMenuItem>
            </>
          )}

          {node.type !== 'connection' && (
            <ContextMenuItem
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              onClick={() => {
                if (node.type === 'table' && onDropTable) {
                  onDropTable(node.name);
                } else if (node.type === 'database' && onDropDatabase) {
                  onDropDatabase(node.name);
                }
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {node.type === 'database' ? t('sidebar.dropDatabase') : t('sidebar.dropTable')}
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onSelectTable={onSelectTable}
              onExport={onExport}
              onCreateTable={onCreateTable}
              onDesignTable={onDesignTable}
              onRefresh={onRefresh}
              onTruncateTable={onTruncateTable}
              onDropTable={onDropTable}
              onGenerateSQL={onGenerateSQL}
              onEditConnection={onEditConnection} // Passed down
              onNewConnection={onNewConnection} // Passed down
              activeConnectionId={activeConnectionId} // Passed down
              onDisconnect={onDisconnect} // Passed down
              onDeleteConnection={onDeleteConnection} // Passed down
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  connections,
  activeConnectionId,
  activeDatabase,
  onSelectTable,
  onSelectDatabase,
  onSelectConnection,
  onNewConnection,
  onEditConnection,
  onExport,
  onCreateTable,
  onDesignTable,
  onTruncateTable,
  onDropTable,
  onGenerateSQL,
  onDisconnect,
  onDeleteConnection
}) => {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  // Initialize tree from connections
  useEffect(() => {
    const initialTree: TreeNode[] = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      type: 'connection',
      connectionId: conn.id,
      children: [],
      isLoaded: false,
      data: conn // Store the full connection object
    }));
    setTreeData(initialTree);
  }, [connections]);

  const updateNode = (nodes: TreeNode[], id: string, updates: Partial<TreeNode>): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateNode(node.children, id, updates) };
      }
      return node;
    });
  };

  const loadDatabasesForConnection = async (node: TreeNode) => {
    if (node.isLoaded || !node.connectionId) return;

    // Set loading
    setTreeData(prev => updateNode(prev, node.id, { isLoading: true }));

    try {
      // Find the connection type
      const connection = connections.find(c => c.id === node.connectionId);
      if (!connection) throw new Error('Connection not found');

      let dbs: string[];
      try {
        dbs = await getDatabases(node.connectionId, connection.type);
      } catch (e) {
        // If failed, try to reconnect
        console.log('Failed to get databases, trying to reconnect...', e);
        const connectionString = buildConnectionString(connection);
        await connectToDatabase(node.connectionId!, connection.type, connectionString);
        // Retry get databases
        dbs = await getDatabases(node.connectionId, connection.type);
      }

      const children: TreeNode[] = dbs.map((db, idx) => ({
        id: `${node.id}_db_${idx}`,
        name: db,
        type: 'database',
        parentId: node.id,
        connectionId: node.connectionId,
        children: [],
        isLoaded: false,
        data: { connectionType: connection.type }
      }));

      setTreeData(prev => updateNode(prev, node.id, {
        children,
        isLoading: false,
        isLoaded: true
      }));
    } catch (error) {
      console.error('Failed to load databases', error);
      setTreeData(prev => updateNode(prev, node.id, { isLoading: false }));
    }
  };

  const loadTablesForDatabase = async (node: TreeNode) => {
    if (node.isLoaded || !node.connectionId) return;

    setTreeData(prev => updateNode(prev, node.id, { isLoading: true }));

    try {
      const connection = connections.find(c => c.id === node.connectionId);
      if (!connection) throw new Error('Connection not found');

      let tables: string[];
      try {
        tables = await getTables(node.connectionId, node.name, connection.type);
      } catch (e) {
        console.log('Failed to get tables, trying to reconnect...', e);
        const connectionString = buildConnectionString(connection);
        await connectToDatabase(node.connectionId!, connection.type, connectionString);
        tables = await getTables(node.connectionId, node.name, connection.type);
      }

      const children: TreeNode[] = tables.map((table, idx) => ({
        id: `${node.id}_t_${idx}`,
        name: table,
        type: 'table',
        parentId: node.id,
        connectionId: node.connectionId,
        data: { databaseName: node.name, connectionType: connection.type }
      }));

      setTreeData(prev => updateNode(prev, node.id, {
        children,
        isLoading: false,
        isLoaded: true
      }));
    } catch (error) {
      console.error('Failed to load tables', error);
      setTreeData(prev => updateNode(prev, node.id, { isLoading: false }));
    }
  };

  const handleRefresh = async (node: TreeNode) => {
    // Reset loaded state so load functions will re-fetch
    setTreeData(prev => updateNode(prev, node.id, { isLoaded: false }));

    // Force expand if not expanded
    if (!expandedIds.has(node.id)) {
      setExpandedIds(prev => new Set(prev).add(node.id));
    }

    // Load functions will handle setting isLoading themselves
    if (node.type === 'connection') {
      await loadDatabasesForConnection(node);
    } else if (node.type === 'database') {
      await loadTablesForDatabase(node);
    }
  };

  const handleToggle = async (node: TreeNode) => {
    const isExpanding = !expandedIds.has(node.id);

    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });

    if (isExpanding && !node.isLoaded) {
      if (node.type === 'connection') {
        await loadDatabasesForConnection(node);
      } else if (node.type === 'database') {
        await loadTablesForDatabase(node);
      }
    }
  };

  const handleSelect = (node: TreeNode) => {
    if (node.type === 'table') {
      onSelectTable(node.name, node.data?.databaseName, node.connectionId);
    } else if (node.type === 'connection') {
      onSelectConnection?.(node.id);
    } else if (node.type === 'database') {
      // Optional: Select database when clicked
      if (node.connectionId) {
        onSelectDatabase?.(node.name, node.connectionId);
      }
    }
  };

  return (
    <div className="flex flex-col h-full border-r glass-strong border-white/5">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-theme-primary shrink-0">
        <h3 className="text-[11px] font-semibold text-theme-tertiary uppercase tracking-wider">{t('sidebar.connections')}</h3>
        <button
          onClick={onNewConnection}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          title={t('sidebar.newConnection')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {treeData.length === 0 ? (
          <div className="p-4 text-center text-xs text-theme-tertiary">
            {t('sidebar.noConnections', 'No connections. Click + to add one.')}
          </div>
        ) : treeData.map(node => (
          <TreeItem
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            onToggle={handleToggle}
            onSelect={handleSelect}
            onSelectTable={onSelectTable}
            onExport={onExport}
            onCreateTable={(dbName) => {
              const conn = connections.find(c => c.id === node.connectionId);
              onCreateTable && onCreateTable(dbName, conn?.type);
            }}
            onDesignTable={onDesignTable}
            onRefresh={handleRefresh}
            onTruncateTable={onTruncateTable}
            onDropTable={onDropTable}
            onGenerateSQL={onGenerateSQL}
            onEditConnection={onEditConnection}
            onNewConnection={onNewConnection}
            isActive={node.type === 'database' && node.name === selectedId}
            activeConnectionId={activeConnectionId}
            onDisconnect={onDisconnect}
            onDeleteConnection={onDeleteConnection}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
