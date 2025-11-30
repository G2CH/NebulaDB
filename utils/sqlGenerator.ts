import { ColumnDef, IndexDef, ForeignKeyDef } from '../components/TableDesigner/types';

/**
 * Generate CREATE TABLE SQL from table designer definitions
 */
export const generateCreateTableSQL = (
    tableName: string,
    columns: ColumnDef[],
    indexes: IndexDef[],
    foreignKeys: ForeignKeyDef[],
    comment?: string,
    dbType: 'postgres' | 'mysql' | 'sqlite' = 'postgres',
    tableOptions?: {
        charset?: string;
        collation?: string;
        engine?: string;
        autoIncrement?: number;
    }
): string => {
    if (!tableName || columns.length === 0) {
        throw new Error('Table name and at least one column are required');
    }

    const lines: string[] = [];
    lines.push(`CREATE TABLE ${tableName} (`);

    // Column definitions
    const columnDefs = columns.map(col => {
        const parts: string[] = [`  ${col.name}`];

        // Data type
        parts.push(col.type.toUpperCase());

        // Length/precision
        if (col.length) {
            parts[parts.length - 1] += `(${col.length})`;
        }

        // Constraints
        if (col.isPrimaryKey) {
            parts.push('PRIMARY KEY');
        }
        if (col.isNotNull || col.isPrimaryKey) {
            parts.push('NOT NULL');
        }
        if (col.isAutoIncrement) {
            if (dbType === 'postgres') {
                // For PostgreSQL, use SERIAL or BIGSERIAL
                const typeIndex = parts.findIndex(p => p.includes('INT'));
                if (typeIndex !== -1) {
                    parts[typeIndex] = col.type.toLowerCase().includes('big') ? 'BIGSERIAL' : 'SERIAL';
                }
            } else if (dbType === 'mysql') {
                parts.push('AUTO_INCREMENT');
            }
        }
        if (col.defaultValue) {
            parts.push(`DEFAULT ${col.defaultValue}`);
        }
        if (col.comment && dbType === 'mysql') {
            parts.push(`COMMENT '${col.comment}'`);
        }

        return parts.join(' ');
    });

    lines.push(columnDefs.join(',\n'));

    // Indexes (non-primary, non-unique from columns)
    if (indexes.length > 0) {
        indexes.forEach(idx => {
            if (idx.type === 'NORMAL') {
                lines.push(`,\n  INDEX ${idx.name} (${idx.columns.join(', ')})`);
            } else if (idx.type === 'UNIQUE') {
                lines.push(`,\n  UNIQUE INDEX ${idx.name} (${idx.columns.join(', ')})`);
            }
        });
    }

    // Foreign keys
    if (foreignKeys.length > 0) {
        foreignKeys.forEach(fk => {
            const onDelete = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : '';
            const onUpdate = fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : '';
            lines.push(`,\n  FOREIGN KEY (${fk.sourceColumn}) REFERENCES ${fk.refTable}(${fk.refColumn})${onDelete}${onUpdate}`);
        });
    }

    lines.push('\n)');

    // MySQL-specific table options
    if (dbType === 'mysql' && tableOptions) {
        const opts: string[] = [];
        if (tableOptions.engine) opts.push(`ENGINE=${tableOptions.engine}`);
        if (tableOptions.charset) opts.push(`DEFAULT CHARSET=${tableOptions.charset}`);
        if (tableOptions.collation) opts.push(`COLLATE=${tableOptions.collation}`);
        if (tableOptions.autoIncrement && tableOptions.autoIncrement > 1) opts.push(`AUTO_INCREMENT=${tableOptions.autoIncrement}`);
        if (comment) opts.push(`COMMENT='${comment}'`);

        if (opts.length > 0) {
            lines.push(' ' + opts.join(' '));
        }
    }

    lines.push(';');

    return lines.join('');
};

/**
 * Generate ALTER TABLE SQL for modifying existing table
 */
export const generateAlterTableSQL = (
    tableName: string,
    originalColumns: ColumnDef[],
    newColumns: ColumnDef[],
    dbType: 'postgres' | 'mysql' | 'sqlite' = 'postgres'
): string[] => {
    const statements: string[] = [];

    // 1. Find dropped columns (id present in original but not in new)
    const droppedColumns = originalColumns.filter(
        origCol => !newColumns.find(newCol => newCol.id === origCol.id)
    );

    // 2. Find added columns (id present in new but not in original)
    const addedColumns = newColumns.filter(
        newCol => !originalColumns.find(origCol => origCol.id === newCol.id)
    );

    // 3. Find modified columns (id matches, but content differs)
    const modifiedColumns = newColumns.filter(newCol => {
        const origCol = originalColumns.find(c => c.id === newCol.id);
        if (!origCol) return false;
        // Check if anything changed
        return JSON.stringify(newCol) !== JSON.stringify(origCol);
    });

    // Handle Drops
    droppedColumns.forEach(col => {
        statements.push(`ALTER TABLE ${tableName} DROP COLUMN ${col.name};`);
    });

    // Handle Adds
    addedColumns.forEach(col => {
        let colDef = `${col.name} ${col.type.toUpperCase()}`;
        if (col.length) colDef += `(${col.length})`;
        if (col.isNotNull) colDef += ' NOT NULL';
        if (col.defaultValue) colDef += ` DEFAULT ${col.defaultValue}`;
        statements.push(`ALTER TABLE ${tableName} ADD COLUMN ${colDef};`);
    });

    // Handle Modifications
    modifiedColumns.forEach(col => {
        const origCol = originalColumns.find(c => c.id === col.id)!;

        // Rename check
        if (origCol.name !== col.name) {
            statements.push(`ALTER TABLE ${tableName} RENAME COLUMN ${origCol.name} TO ${col.name};`);
        }

        // Type/Constraint changes
        if (dbType === 'postgres') {
            // Type change
            if (origCol.type !== col.type || origCol.length !== col.length) {
                let typeDef = col.type.toUpperCase();
                if (col.length) typeDef += `(${col.length})`;
                // Add USING clause to attempt conversion if needed, but simple TYPE is usually enough for compatible types
                statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.name} TYPE ${typeDef};`);
            }
            // Not Null
            if (origCol.isNotNull !== col.isNotNull) {
                statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.name} ${col.isNotNull ? 'SET' : 'DROP'} NOT NULL;`);
            }
            // Default
            if (origCol.defaultValue !== col.defaultValue) {
                if (col.defaultValue) {
                    statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.name} SET DEFAULT ${col.defaultValue};`);
                } else {
                    statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.name} DROP DEFAULT;`);
                }
            }
        } else if (dbType === 'mysql') {
            // MySQL uses MODIFY COLUMN and re-states the whole definition
            let colDef = `${col.name} ${col.type.toUpperCase()}`;
            if (col.length) colDef += `(${col.length})`;
            if (col.isNotNull) colDef += ' NOT NULL';
            if (col.defaultValue) colDef += ` DEFAULT ${col.defaultValue}`;
            statements.push(`ALTER TABLE ${tableName} MODIFY COLUMN ${colDef};`);
        } else {
            statements.push(`-- SQLite: ALTER COLUMN not supported fully, manual migration required`);
        }
    });

    return statements;
};
