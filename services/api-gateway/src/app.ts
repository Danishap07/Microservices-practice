import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

const app = express();
const port = Number(process.env.GATEWAY_PORT) || 8000;

const INVENTORY_URL = process.env.INVENTORY_URL || 'http://inventory:8003';
const ORDERS_URL = process.env.ORDERS_URL || 'http://orders:8002';
const AUTH_URL = process.env.AUTH_URL || 'http://auth:8001';

app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});
app.use(limiter);

app.use(
  '/inventory',
  createProxyMiddleware({
    target: INVENTORY_URL,
    changeOrigin: true,
    pathRewrite: { '^/inventory': '' },
  }),
);

app.use(
  '/orders',
  createProxyMiddleware({
    target: ORDERS_URL,
    changeOrigin: true,
    pathRewrite: { '^/orders': '' },
  }),
);

app.use(
  '/auth',
  createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true,
    pathRewrite: { '^/auth': '' },
  }),
);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ service: 'api-gateway', status: 'running' });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API Gateway running on port ${port}`);
    console.log(`  Inventory → ${INVENTORY_URL}`);
    console.log(`  Orders    → ${ORDERS_URL}`);
    console.log(`  Auth      → ${AUTH_URL}`);
  });
}

export { app };
