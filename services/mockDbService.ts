
import { QueryResult, TableSchema } from '../types';
import { MOCK_SCHEMA } from '../constants';
import { ColumnDef } from '../components/TableDesigner/types';

// Simple mock data generator based on schema
const generateMockData = (table: TableSchema, count: number) => {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const row = table.columns.map(col => {
      if (col.name === 'id') return col.type === 'uuid' ? `550e8400-e29b-41d4-a716-${446655440000 + i}` : i + 1;
      if (col.name.includes('email')) return `user${i}@example.com`;
      if (col.name.includes('name')) return `User ${i} Name`;
      if (col.name.includes('date') || col.name.includes('at')) return new Date().toISOString();
      if (col.name.includes('amount') || col.name.includes('price')) return (Math.random() * 1000).toFixed(2);
      if (col.name === 'status') return ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)];
      if (col.name === 'role') return ['admin', 'user', 'editor'][Math.floor(Math.random() * 3)];
      return `Data ${i}`;
    });
    rows.push(row);
  }
  return rows;
};

export const executeMockQuery = async (query: string): Promise<QueryResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerQuery = query.toLowerCase().trim();

      // Basic naive parsing for demo purposes
      if (lowerQuery.startsWith('select')) {
        // Find which table is being queried
        const table = MOCK_SCHEMA.tables.find(t => lowerQuery.includes(t.name));

        if (table) {
          const limitMatch = lowerQuery.match(/limit\s+(\d+)/);
          const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;

          resolve({
            columns: table.columns.map(c => c.name),
            rows: generateMockData(table, Math.min(limit, 100)), // Cap at 100 for safety
            executionTimeMs: Math.floor(Math.random() * 50) + 10
          });
          return;
        }
      }
      
      // Fallback response for unparsed queries
      resolve({
        columns: ['result', 'message'],
        rows: [['OK', 'Query executed successfully (Mock)']],
        executionTimeMs: 12,
        affectedRows: 0
      });

    }, 300); // Simulate network latency
  });
};

// Helper to convert internal Schema format to Designer format
export const getTableSchema = async (tableName: string): Promise<ColumnDef[]> => {
    return new Promise((resolve) => {
        const table = MOCK_SCHEMA.tables.find(t => t.name === tableName);
        if (!table) {
            resolve([]);
            return;
        }
        
        const designerCols: ColumnDef[] = table.columns.map(c => {
            const typeParts = c.type.match(/(\w+)(?:\(([^)]+)\))?/);
            const typeName = typeParts ? typeParts[1].toUpperCase() : 'VARCHAR';
            const typeLen = typeParts ? typeParts[2] || '' : '';

            return {
                id: `col_${Math.random().toString(36).substr(2, 9)}`,
                status: 'clean',
                originalName: c.name,
                name: c.name,
                type: typeName,
                length: typeLen,
                isPrimaryKey: !!c.isPrimaryKey,
                isNotNull: false, // Mock default
                isAutoIncrement: c.type === 'serial',
                defaultValue: '',
                comment: ''
            };
        });
        resolve(designerCols);
    });
};
