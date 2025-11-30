import { Connection } from '../types';

export const buildConnectionString = (connection: Connection): string => {
    if (connection.type === 'sqlite') {
        return `sqlite://${connection.database}`;
    }

    if (connection.type === 'redis') {
        return `redis://${connection.host}:${connection.port || '6379'}/`;
    }

    const user = connection.user || '';
    const password = connection.password || '';
    const host = connection.host || 'localhost';
    const port = connection.port || (connection.type === 'postgres' ? '5432' : '3306');
    const database = connection.database || (connection.type === 'postgres' ? 'postgres' : '');

    return `${connection.type}://${user}:${password}@${host}:${port}/${database}`;
};
