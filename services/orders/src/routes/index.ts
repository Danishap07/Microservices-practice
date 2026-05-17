import { Router } from 'express';
import { authenticate } from '@microkit/shared';
import * as ordersController from '../controllers/ordersController';

const router = Router();

router.get('/', authenticate, ordersController.listOrders);
router.post('/', authenticate, ordersController.createOrder);
router.get('/:orderId', authenticate, ordersController.getOrder);

export default router;
