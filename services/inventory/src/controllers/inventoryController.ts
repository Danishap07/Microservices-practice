import { Request, Response } from 'express';
import {
  cacheGet,
  cacheSet,
  publishEvent,
  BadRequestError,
  NotFoundError,
} from '@microservices/shared';
import { Product } from '../models/Product';

export async function listProducts(_req: Request, res: Response): Promise<void> {
  const products = await Product.find();
  res.json(products);
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;

  const cached = await cacheGet(`inventory:${productId}`);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  const product = await Product.findOne({ productId });
  if (!product) {
    throw new NotFoundError(`Product '${productId}' not found`);
  }

  await cacheSet(`inventory:${productId}`, JSON.stringify(product), 30);
  res.json(product);
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const { productId, name, price, stock } = req.body;

  if (!productId || !name || price === undefined) {
    throw new BadRequestError('productId, name, and price are required');
  }

  const existing = await Product.findOne({ productId });
  if (existing) {
    throw new BadRequestError(`Product '${productId}' already exists`);
  }

  const product = await Product.create({ productId, name, price, stock: stock ?? 0 });

  await publishEvent('inventory.product.created', {
    event: 'inventory.product.created',
    productId,
    name,
    price,
    stock: product.stock,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(product);
}

export async function updateStock(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;
  const { stock } = req.body;

  if (stock === undefined || !Number.isInteger(stock) || stock < 0) {
    throw new BadRequestError('stock is required and must be a non-negative integer');
  }

  const product = await Product.findOneAndUpdate({ productId }, { stock }, { new: true });
  if (!product) {
    throw new NotFoundError(`Product '${productId}' not found`);
  }

  await cacheSet(`inventory:${productId}`, JSON.stringify(product), 30);

  await publishEvent('inventory.stock.updated', {
    event: 'inventory.stock.updated',
    productId,
    stock,
    timestamp: new Date().toISOString(),
  });

  res.json(product);
}

export async function handleOrderCreated(productId: string, quantity: number): Promise<void> {
  const product = await Product.findOne({ productId });
  if (!product) {
    console.error(`[Inventory] Product '${productId}' not found — skipping stock update`);
    return;
  }

  const before = product.stock;
  product.stock -= quantity;
  await product.save();

  await cacheSet(`inventory:${productId}`, JSON.stringify(product), 30);
  console.log(`[Inventory] Stock ${productId}: ${before} → ${product.stock} (order -${quantity})`);

  if (product.stock < 10) {
    await publishEvent('inventory.low_stock', {
      event: 'inventory.low_stock',
      productId,
      remainingStock: product.stock,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Inventory] Low stock alert for '${productId}': ${product.stock} remaining`);
  }
}
