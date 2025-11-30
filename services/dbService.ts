import { invoke } from '@tauri-apps/api/core';
import { QueryResult, TableSchema, ColumnDef } from '../types';

export const connectToDatabase = async (id: string, type: 'postgres' | 'mysql' | 'sqlite' | 'redis', connectionString: string): Promise<string> => {
    if (type === 'mysql') {
        return await invoke('connect_mysql', { connectionId: id, connectionString });
    }
    if (type === 'sqlite') {
        return await invoke('connect_sqlite', { connectionId: id, connectionString });
    }
    if (type === 'redis') {
        return await invoke('connect_redis', { connectionId: id, connectionString });
    }
    return await invoke('connect_postgres', { connectionId: id, connectionString });
};

export const executeRedisCommand = async (connectionId: string, command: string, args: string[]): Promise<string> => {
    return await invoke('execute_redis_command', { connectionId, command, args });
};

export const executeQuery = async (connectionId: string, query: string, database?: string, connectionType?: string): Promise<QueryResult> => {
    // Note: We cannot simply prepend "USE db;" for MySQL because sqlx uses prepared statements which don't support multi-statements.
    // For MySQL, we should use fully qualified names (db.table) in the query generation where possible.
    // For Postgres, we must be connected to the correct database.

    return await invoke('execute_query', { connectionId, query, database });
};

// Keep these for now as they might be useful or need migration
export const getDatabases = async (connectionId: string, type: 'postgres' | 'mysql' | 'sqlite'): Promise<string[]> => {
    let query = '';
    if (type === 'mysql') {
        query = 'SHOW DATABASES';
    } else if (type === 'postgres') {
        query = "SELECT datname FROM pg_database WHERE datistemplate = false";
    } else {
        // SQLite usually doesn't have multiple databases in the same connection context in this way
        return ['main'];
    }

    try {
        const result = await executeQuery(connectionId, query);
        // Map result to string array based on DB type
        return result.rows.map(row => row[0] as string);
    } catch (error) {
        console.error('Failed to fetch databases:', error);
        throw error;
    }
};

export const getTables = async (connectionId: string, database: string, type: 'postgres' | 'mysql' | 'sqlite'): Promise<string[]> => {
    let query = '';
    if (type === 'mysql') {
        // Switch DB first or use fully qualified name. 
        // For safety, we might want to just query information_schema or assume the connection is already on the right DB if we switched.
        // But `executeQuery` might not persist state if it's a pool.
        // Best approach for MySQL pool: `SHOW TABLES FROM database`
        query = `SHOW TABLES FROM \`${database}\``;
    } else if (type === 'postgres') {
        // Postgres requires connecting to the specific DB to see its tables usually.
        // But if we are just listing, we might be limited to the connected DB.
        // Assuming we are connected to the right DB or 'postgres' DB.
        // If we need to list tables of another DB, we might need a new connection.
        // For now, let's assume we list tables of the *current* connection's DB.
        // If the user expands a different DB in the tree, we might need to `connect` again with that DB name?
        // Or we just query information_schema.tables?
        // Note: Cross-database queries in Postgres are not standard.
        // Let's stick to 'public' schema of current DB for now.
        query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
    } else {
        query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
    }

    try {
        const result = await executeQuery(connectionId, query);
        return result.rows.map(row => row[0] as string);
    } catch (error) {
        console.error('Failed to fetch tables:', error);
        return [];
    }
};

// Keep for compatibility
export const getTableStructure = async (
    connectionId: string,
    tableName: string,
    database?: string,
    type?: 'postgres' | 'mysql' | 'sqlite'
): Promise<{
    id: string;
    status: string;
    name: string;
    type: string;
    length?: string;
    isPrimaryKey?: boolean;
    isNotNull?: boolean;
    isAutoIncrement?: boolean;
    defaultValue?: string;
    comment?: string;
}[]> => {
    let query = '';

    if (type === 'postgres') {
        query = `
            SELECT 
                column_name, 
                data_type, 
                character_maximum_length,
                is_nullable,
                column_default,
                is_identity
            FROM information_schema.columns 
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position
        `;
    } else if (type === 'mysql') {
        const dbClause = database ? `AND TABLE_SCHEMA = '${database}'` : 'AND TABLE_SCHEMA = DATABASE()';
        query = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                EXTRA,
                COLUMN_KEY,
                COLUMN_COMMENT
            FROM information_schema.columns 
            WHERE TABLE_NAME = '${tableName}' 
            ${dbClause}
            ORDER BY ORDINAL_POSITION
        `;
        console.log('[DEBUG] getTableStructure MySQL query:', query);
    } else {
        // SQLite
        query = `PRAGMA table_info('${tableName}')`;
    }

    try {
        const result = await executeQuery(connectionId, query, database, type);
        console.log('[DEBUG] getTableStructure result rows:', result.rows?.length || 0);

        if (type === 'sqlite') {
            // SQLite PRAGMA output: cid, name, type, notnull, dflt_value, pk
            return result.rows.map((row: any) => ({
                id: `col_${row[0]}`,
                status: 'clean',
                name: row[1],
                type: row[2],
                length: '', // SQLite types don't strictly have length
                isPrimaryKey: !!row[5],
                isNotNull: !!row[3],
                isAutoIncrement: false, // Hard to detect reliably from PRAGMA alone without parsing SQL
                defaultValue: row[4] !== null ? String(row[4]) : '',
                comment: ''
            }));
        }

        return result.rows.map((row: any, index: number) => {
            const isPostgres = type === 'postgres';
            const name = row[0];
            const dataType = row[1];
            const maxLength = row[2];
            const isNullable = row[3] === 'YES';
            const defaultValue = row[4];
            const extra = row[5]; // is_identity for PG, EXTRA for MySQL
            const columnKey = row[6]; // COLUMN_KEY for MySQL
            const columnComment = row[7]; // COLUMN_COMMENT for MySQL

            return {
                id: `col_${index}`,
                status: 'clean',
                name: name,
                type: dataType,
                length: maxLength ? String(maxLength) : '',
                isPrimaryKey: isPostgres ? false : (columnKey === 'PRI'),
                isNotNull: !isNullable,
                isAutoIncrement: isPostgres ? (extra === 'YES' || (defaultValue && defaultValue.includes('nextval'))) : (extra && extra.includes('auto_increment')),
                defaultValue: defaultValue !== null ? String(defaultValue) : '',
                comment: columnComment || ''
            };
        });
    } catch (error) {
        console.error('Failed to fetch table structure:', error);
        return [];
    }
};

export const getTableInfo = async (
    connectionId: string,
    tableName: string,
    database?: string,
    type?: 'postgres' | 'mysql' | 'sqlite'
): Promise<{ rowCount: string; size: string; engine: string; collation: string; comment?: string }> => {
    let query = '';

    if (type === 'mysql') {
        query = `
            SELECT 
                TABLE_ROWS, 
                (DATA_LENGTH + INDEX_LENGTH) as SIZE_BYTES, 
                ENGINE, 
                TABLE_COLLATION,
                TABLE_COMMENT 
            FROM information_schema.TABLES 
            WHERE TABLE_NAME = '${tableName}' 
            AND TABLE_SCHEMA = '${database}'
        `;
    } else if (type === 'postgres') {
        // Postgres: Get estimate row count and size
        query = `
            SELECT 
                (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = '${tableName}') as row_count,
                pg_total_relation_size('${tableName}') as size_bytes,
                'Heap' as engine,
                (SELECT datcollate FROM pg_database WHERE datname = current_database()) as collation
        `;
    } else {
        // SQLite
        query = `SELECT count(*) as row_count FROM '${tableName}'`;
    }

    try {
        const result = await executeQuery(connectionId, query, database, type);

        if (result.rows.length === 0) {
            return { rowCount: '-', size: '-', engine: '-', collation: '-' };
        }

        const row = result.rows[0];

        if (type === 'mysql') {
            return {
                rowCount: String(row[0] || 0),
                size: formatBytes(Number(row[1] || 0)),
                engine: String(row[2] || '-'),
                collation: String(row[3] || '-'),
                comment: String(row[4] || '')
            };
        } else if (type === 'postgres') {
            return {
                rowCount: String(row[0] || 0),
                size: formatBytes(Number(row[1] || 0)),
                engine: String(row[2] || 'Heap'),
                collation: String(row[3] || '-')
            };
        } else {
            // SQLite
            return {
                rowCount: String(row[0] || 0),
                size: '-', // SQLite doesn't easily give per-table size
                engine: 'SQLite',
                collation: '-' // SQLite uses per-column collation
            };
        }
    } catch (error) {
        console.error('Failed to fetch table info:', error);
        return { rowCount: '-', size: '-', engine: '-', collation: '-' };
    }
};

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const getTableIndexes = async (connectionId: string, tableName: string, type: 'postgres' | 'mysql' | 'sqlite' = 'postgres'): Promise<any[]> => {
    let query = '';

    if (type === 'postgres') {
        query = `
            SELECT
                i.relname as index_name,
                a.attname as column_name,
                ix.indisunique as is_unique,
                ix.indisprimary as is_primary
            FROM
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a
            WHERE
                t.oid = ix.indrelid
                AND i.oid = ix.indexrelid
                AND a.attrelid = t.oid
                AND a.attnum = ANY(ix.indkey)
                AND t.relkind = 'r'
                AND t.relname = '${tableName}'
            ORDER BY
                t.relname,
                i.relname
        `;
    } else if (type === 'mysql') {
        query = `SHOW INDEX FROM \`${tableName}\``;
    } else {
        query = `PRAGMA index_list('${tableName}')`;
    }

    try {
        const result = await executeQuery(connectionId, query);

        if (type === 'sqlite') {
            // SQLite PRAGMA index_list: seq, name, unique, origin, partial
            // Need to query index_info for columns
            const indexes = await Promise.all(result.rows.map(async (row: any) => {
                const indexName = row[1];
                const isUnique = !!row[2];
                const infoQuery = `PRAGMA index_info('${indexName}')`;
                const infoResult = await executeQuery(connectionId, infoQuery);
                const columns = infoResult.rows.map((r: any) => r[2]);

                return {
                    name: indexName,
                    columns: columns,
                    type: isUnique ? 'UNIQUE' : 'NORMAL',
                    unique: isUnique ? 'Yes' : 'No'
                };
            }));
            return indexes;
        }

        if (type === 'mysql') {
            // Group by index name
            const indexMap = new Map();
            result.rows.forEach((row: any) => {
                const indexName = row[2]; // Key_name
                const columnName = row[4]; // Column_name
                const nonUnique = row[1]; // Non_unique

                if (!indexMap.has(indexName)) {
                    indexMap.set(indexName, {
                        name: indexName,
                        columns: [],
                        type: nonUnique == 0 ? 'UNIQUE' : 'NORMAL',
                        unique: nonUnique == 0 ? 'Yes' : 'No'
                    });
                }
                indexMap.get(indexName).columns.push(columnName);
            });
            return Array.from(indexMap.values());
        }

        // Postgres
        const indexMap = new Map();
        result.rows.forEach((row: any) => {
            const indexName = row[0];
            const columnName = row[1];
            const isUnique = row[2];
            const isPrimary = row[3];

            if (!indexMap.has(indexName)) {
                indexMap.set(indexName, {
                    name: indexName,
                    columns: [],
                    type: isPrimary ? 'PRIMARY' : (isUnique ? 'UNIQUE' : 'NORMAL'),
                    unique: isUnique ? 'Yes' : 'No'
                });
            }
            indexMap.get(indexName).columns.push(columnName);
        });
        return Array.from(indexMap.values());

    } catch (error) {
        console.error('Failed to fetch indexes:', error);
        return [];
    }
};

export const getForeignKeys = async (connectionId: string, tableName: string, type: 'postgres' | 'mysql' | 'sqlite' = 'postgres'): Promise<any[]> => {
    let query = '';

    if (type === 'postgres') {
        query = `
            SELECT
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.update_rule,
                rc.delete_rule
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${tableName}';
        `;
    } else if (type === 'mysql') {
        query = `
            SELECT 
                CONSTRAINT_NAME, 
                COLUMN_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = '${tableName}';
        `;
    } else {
        query = `PRAGMA foreign_key_list('${tableName}')`;
    }

    try {
        const result = await executeQuery(connectionId, query);

        if (type === 'sqlite') {
            // id, seq, table, from, to, on_update, on_delete, match
            return result.rows.map((row: any) => ({
                name: `fk_${row[0]}`, // SQLite doesn't give named constraints easily here
                column: row[3],
                refTable: row[2],
                refColumn: row[4],
                onUpdate: row[5],
                onDelete: row[6]
            }));
        }

        if (type === 'mysql') {
            return result.rows.map((row: any) => ({
                name: row[0],
                column: row[1],
                refTable: row[2],
                refColumn: row[3],
                onUpdate: 'RESTRICT', // Need another query for rules in MySQL usually
                onDelete: 'RESTRICT'
            }));
        }

        // Postgres
        return result.rows.map((row: any) => ({
            name: row[0],
            column: row[1],
            refTable: row[2],
            refColumn: row[3],
            onUpdate: row[4],
            onDelete: row[5]
        }));

    } catch (error) {
        console.error('Failed to fetch foreign keys:', error);
        return [];
    }
};

export const dropDatabase = async (connectionId: string, databaseName: string, type: 'postgres' | 'mysql' | 'sqlite' = 'postgres'): Promise<void> => {
    let query = '';
    if (type === 'postgres' || type === 'mysql') {
        query = `DROP DATABASE IF EXISTS ${databaseName}`;
    } else {
        console.warn('DROP DATABASE not fully supported for SQLite via query');
        return;
    }
    await executeQuery(connectionId, query);
};

export const truncateTable = async (connectionId: string, tableName: string, type: 'postgres' | 'mysql' | 'sqlite' = 'postgres'): Promise<void> => {
    let query = '';
    if (type === 'sqlite') {
        query = `DELETE FROM ${tableName}`;
    } else {
        query = `TRUNCATE TABLE ${tableName}`;
    }
    await executeQuery(connectionId, query);
};

export const emptyTable = async (connectionId: string, tableName: string): Promise<void> => {
    await executeQuery(connectionId, `DELETE FROM ${tableName}`);
};
