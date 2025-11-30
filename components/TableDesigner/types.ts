import { RowStatus, ColumnDef } from '../../types';

export type { RowStatus, ColumnDef };

export interface IndexDef {
  id: string;
  status: RowStatus;
  name: string;
  type: 'NORMAL' | 'UNIQUE' | 'FULLTEXT';
  columns: string[];
}

export interface ForeignKeyDef {
  id: string;
  status: RowStatus;
  name: string;
  sourceColumn: string;
  refTable: string;
  refColumn: string;
  onDelete: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
  onUpdate: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
}
