
import { ColumnDef, IndexDef, ForeignKeyDef } from '../components/TableDesigner/types';

export const generateCreateSql = (tableName: string, columns: ColumnDef[], indexes: IndexDef[], foreignKeys: ForeignKeyDef[], comment?: string) => {
    // Filter out deleted columns
    const activeCols = columns.filter(c => c.status !== 'deleted');

    const colsSql = activeCols.map(c => {
        let line = `  \`${c.name}\` ${c.type}${c.length ? `(${c.length})` : ''}`;
        if (c.isNotNull) line += ' NOT NULL';
        if (c.isAutoIncrement) line += ' AUTO_INCREMENT';
        if (c.defaultValue) line += ` DEFAULT '${c.defaultValue}'`;
        if (c.comment) line += ` COMMENT '${c.comment}'`;
        return line;
    }).join(',\n');

    const pk = activeCols.filter(c => c.isPrimaryKey).map(c => `\`${c.name}\``).join(', ');
    const pkSql = pk ? `,\n  PRIMARY KEY (${pk})` : '';

    const idxSql = indexes.filter(i => i.status !== 'deleted').map(i => {
        const typeStr = i.type === 'UNIQUE' ? 'UNIQUE INDEX' : i.type === 'FULLTEXT' ? 'FULLTEXT INDEX' : 'INDEX';
        return `,\n  ${typeStr} \`${i.name}\` (${i.columns.map(c => `\`${c}\``).join(', ')})`;
    }).join('');

    const fkSql = foreignKeys.filter(fk => fk.status !== 'deleted').map(fk => {
        return `,\n  CONSTRAINT \`${fk.name}\` FOREIGN KEY (\`${fk.sourceColumn}\`) REFERENCES \`${fk.refTable}\`(\`${fk.refColumn}\`) ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`;
    }).join('');

    return `CREATE TABLE \`${tableName}\` (\n${colsSql}${pkSql}${idxSql}${fkSql}\n) COMMENT='${comment || ''}';`;
};

export const generateAlterSql = (tableName: string, columns: ColumnDef[]) => {
    const statements: string[] = [];
    const alterPrefix = `ALTER TABLE \`${tableName}\``;

    columns.forEach(col => {
        const colDef = `${col.type}${col.length ? `(${col.length})` : ''}${col.isNotNull ? ' NOT NULL' : ''}${col.defaultValue ? ` DEFAULT '${col.defaultValue}'` : ''}${col.comment ? ` COMMENT '${col.comment}'` : ''}`;

        if (col.status === 'added') {
            statements.push(`${alterPrefix} ADD COLUMN \`${col.name}\` ${colDef};`);
        } else if (col.status === 'deleted') {
            statements.push(`${alterPrefix} DROP COLUMN \`${col.originalName || col.name}\`;`);
        } else if (col.status === 'modified') {
            if (col.originalName && col.name !== col.originalName) {
                // Rename
                statements.push(`${alterPrefix} CHANGE COLUMN \`${col.originalName}\` \`${col.name}\` ${colDef};`);
            } else {
                // Modify definition
                statements.push(`${alterPrefix} MODIFY COLUMN \`${col.name}\` ${colDef};`);
            }
        }
    });

    if (statements.length === 0) return "-- No changes detected";
    return statements.join('\n');
};
