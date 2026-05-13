import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import { createConsumer } from '@microservices/shared';
import { errorHandler } from './middleware/errorHandler';
import { handleOrderCreated } from './controllers/inventoryController';
import inventoryRoutes from './routes';

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://mongo-inventory:27017/inventory_db')
  .then(() => console.log('Connected to MongoDB for Inventory service'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
const port = Number(process.env.INVENTORY_PORT) || 8003;

app.use(express.json());
app.use('/', inventoryRoutes);
app.use(errorHandler);

createConsumer('inventory-service', ['order.created'], async ({ message }) => {
  if (!message.value) return;
  const { productId, quantity } = JSON.parse(message.value.toString());
  await handleOrderCreated(productId, quantity);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Inventory Service running on port ${port}`);
  });
}

export { app };
