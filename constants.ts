import { Connection, ConnectionStatus, DatabaseSchema } from './types';

export const MOCK_CONNECTIONS: Connection[] = [
  {
    id: 'conn_1',
    name: 'Production (AWS RDS)',
    type: 'postgres',
    host: 'db-prod.aws.amazon.com',
    port: '5432',
    user: 'admin',
    password: '',
    database: 'ecommerce_main',
    status: ConnectionStatus.CONNECTED,
  },
  {
    id: 'conn_2',
    name: 'Staging Environment',
    type: 'mysql',
    host: '192.168.1.55',
    port: '3306',
    user: 'root',
    password: '',
    database: 'staging_v2',
    status: ConnectionStatus.DISCONNECTED,
  },
  {
    id: 'conn_3',
    name: 'Local Dev',
    type: 'sqlite',
    host: 'localhost',
    port: '',
    user: '',
    password: '',
    database: 'local.db',
    status: ConnectionStatus.DISCONNECTED,
  },
];

export const MOCK_SCHEMA: DatabaseSchema = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimaryKey: true },
        { name: 'email', type: 'varchar(255)' },
        { name: 'full_name', type: 'varchar(100)' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'last_login', type: 'timestamp' },
        { name: 'role', type: 'varchar(20)' },
      ]
    },
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'serial', isPrimaryKey: true },
        { name: 'user_id', type: 'uuid' },
        { name: 'total_amount', type: 'decimal(10,2)' },
        { name: 'status', type: 'varchar(50)' },
        { name: 'created_at', type: 'timestamp' },
      ]
    },
    {
      name: 'order_items',
      columns: [
        { name: 'id', type: 'serial', isPrimaryKey: true },
        { name: 'order_id', type: 'integer' },
        { name: 'product_id', type: 'integer' },
        { name: 'quantity', type: 'integer' },
        { name: 'price_per_unit', type: 'decimal(10,2)' },
      ]
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'serial', isPrimaryKey: true },
        { name: 'name', type: 'varchar(255)' },
        { name: 'sku', type: 'varchar(50)' },
        { name: 'stock_quantity', type: 'integer' },
      ]
    }
  ]
};
