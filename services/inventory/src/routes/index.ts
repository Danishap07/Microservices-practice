import { Router } from 'express';
import { authenticate, authorize } from '@microkit/shared';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

router.get('/', inventoryController.listProducts);
router.get('/:productId', inventoryController.getProduct);
router.post('/', authenticate, authorize('admin'), inventoryController.createProduct);
router.put('/:productId/stock', authenticate, authorize('admin'), inventoryController.updateStock);

export default router;
