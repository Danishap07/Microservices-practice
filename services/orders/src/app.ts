import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './database';
import { errorHandler } from './middleware/errorHandler';
import orderRoutes from './routes';

const app = express();
const port = Number(process.env.ORDERS_PORT) || 8002;

app.use(express.json());
app.use('/', orderRoutes);
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log('Connected to PostgreSQL for Orders service');
    if (process.env.NODE_ENV !== 'test') {
      app.listen(port, () => {
        console.log(`Orders Service running on port ${port}`);
      });
    }
  })
  .catch((err) => {
    console.error('PostgreSQL connection error:', err);
    process.exit(1);
  });

export { app };
