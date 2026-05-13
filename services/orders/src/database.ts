import { DataSource } from 'typeorm';
import { Order } from './entity/Order';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres-orders',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'orders_db',
  synchronize: true,
  entities: [Order],
});
