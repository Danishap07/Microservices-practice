import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes';

const app = express();
const port = Number(process.env.AUTH_PORT) || 8001;

app.use(express.json());
app.use('/', authRoutes);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Auth Service running on port ${port}`);
  });
}

export { app };
