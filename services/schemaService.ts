import { getTables, getDatabases, getTableStructure } from './dbService';

interface SchemaTable {
    name: string;
    columns: {
        name: string;
        type: string;
        isPrimaryKey?: boolean;
        isNotNull?: boolean;
    }[];
}

interface DatabaseSchema {
    tables: SchemaTable[];
}

/**
 * Extracts the current database schema for AI context
 * @param connectionId Active connection ID
 * @param database Active database name
 * @param connectionType Type of database (postgres, mysql, sqlite)
 * @returns Schema description for AI
 */
export const extractDatabaseSchema = async (
    connectionId: string,
    database: string | null,
    connectionType: string
): Promise<DatabaseSchema> => {
    try {
        // Get all tables in the current database
        const tableNames = await getTables(connectionId, database || undefined, connectionType as 'postgres' | 'mysql' | 'sqlite');

        // Fetch structure for each table (limit to first 20 to avoid overwhelming the AI)
        const tables: SchemaTable[] = [];
        const tablesToFetch = tableNames.slice(0, 20);

        for (const tableName of tablesToFetch) {
            try {
                const structure = await getTableStructure(connectionId, tableName, database || undefined, connectionType as 'postgres' | 'mysql' | 'sqlite');

                tables.push({
                    name: tableName,
                    columns: structure.map(col => ({
                        name: col.name,
                        type: col.type,
                        isPrimaryKey: col.isPrimaryKey,
                        isNotNull: col.isNotNull
                    }))
                });
            } catch (e) {
                console.warn(`Failed to fetch structure for ${tableName}:`, e);
                // Add table with minimal info
                tables.push({
                    name: tableName,
                    columns: []
                });
            }
        }

        return { tables };
    } catch (error) {
        console.error('Failed to extract database schema:', error);
        // Return empty schema on failure
        return { tables: [] };
    }
};

/**
 * Formats schema for AI context
 */
export const formatSchemaForAI = (schema: DatabaseSchema): string => {
    if (schema.tables.length === 0) {
        return 'No tables found in the current database.';
    }

    return schema.tables.map(table => {
        const columns = table.columns.length > 0
            ? table.columns.map(col => {
                const flags = [
                    col.isPrimaryKey ? 'PK' : '',
                    col.isNotNull ? 'NOT NULL' : ''
                ].filter(Boolean).join(', ');

                return `${col.name} ${col.type}${flags ? ` (${flags})` : ''}`;
            }).join(', ')
            : '(structure not available)';

        return `Table ${table.name}: ${columns}`;
    }).join('\n');
};
