
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export enum TabType {
  QUERY = 'QUERY',
  TABLE_VIEW = 'TABLE_VIEW',
  SETTINGS = 'SETTINGS',
  TABLE_DESIGNER = 'TABLE_DESIGNER'
}

export interface Connection {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'redis' | 'sqlite';
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  status: ConnectionStatus;
  // SSH Tunnel fields
  sshHost?: string;
  sshPort?: string;
  sshUser?: string;
  sshKeyPath?: string;
  // SSL/TLS fields
  ssl?: boolean;
  caCert?: string;
  clientCert?: string;
  clientKey?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
}

export interface DatabaseSchema {
  tables: TableSchema[];
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTimeMs: number;
  affectedRows?: number;
  error?: string;
}

export interface EditorTab {
  id: string;
  title: string;
  type: TabType;
  content: string; // SQL or other content
  unsavedChanges: boolean;
  associatedTable?: string;
  queryResult?: QueryResult | null;
  isExecuting?: boolean;
  metadata?: Record<string, any>;
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
  };
}

export type RowStatus = 'clean' | 'modified' | 'added' | 'deleted';

export interface ColumnDef {
  id: string;
  status: RowStatus;
  originalName?: string;
  name: string;
  type: string;
  length: string;
  isPrimaryKey: boolean;
  isNotNull: boolean;
  isAutoIncrement: boolean;
  defaultValue: string;
  comment: string;
}
