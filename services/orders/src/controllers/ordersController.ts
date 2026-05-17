import { Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Order } from '../entity/Order';
import {
  publishEvent,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  validateOrderInput,
  logger,
} from '@microkit/shared';

export async function listOrders(req: Request, res: Response): Promise<void> {
  const repo = AppDataSource.getRepository(Order);

  if (req.user?.role === 'admin') {
    const orders = await repo.find({ order: { createdAt: 'DESC' } });
    res.json(orders);
  } else {
    const orders = await repo.find({
      where: { userId: req.user!.id },
      order: { createdAt: 'DESC' },
    });
    res.json(orders);
  }
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const validation = validateOrderInput(req.body);
  if (!validation.valid) {
    throw new BadRequestError(validation.errors.join('; '));
  }

  const { productId, quantity = 1, totalPrice = 0 } = req.body;

  const order = new Order();
  order.id = `ord_${Date.now()}`;
  order.productId = productId;
  order.quantity = quantity;
  order.userId = req.user!.id;
  order.totalPrice = totalPrice;
  order.status = 'created';
  order.createdAt = new Date().toISOString();

  const repo = AppDataSource.getRepository(Order);
  await repo.save(order);

  await publishEvent('order.created', {
    event: 'order.created',
    orderId: order.id,
    productId: order.productId,
    quantity: order.quantity,
    userId: order.userId,
    totalPrice: Number(order.totalPrice),
    timestamp: order.createdAt,
  });

  logger.info('Published order event', { orderId: order.id });
  res.status(201).json(order);
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const repo = AppDataSource.getRepository(Order);
  const orderId = req.params.orderId as string;
  const order = await repo.findOne({ where: { id: orderId } });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (req.user?.role !== 'admin' && order.userId !== req.user?.id) {
    throw new ForbiddenError('You can only view your own orders');
  }

  res.json(order);
}
