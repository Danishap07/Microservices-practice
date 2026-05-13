export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface OrderCreatedEvent {
  event: 'order.created';
  orderId: string;
  productId: string;
  quantity: number;
  userId: string;
  totalPrice: number;
  timestamp: string;
}

export interface InventoryProductCreatedEvent {
  event: 'inventory.product.created';
  productId: string;
  name: string;
  price: number;
  stock: number;
  timestamp: string;
}

export interface InventoryStockUpdatedEvent {
  event: 'inventory.stock.updated';
  productId: string;
  stock: number;
  timestamp: string;
}

export interface InventoryLowStockEvent {
  event: 'inventory.low_stock';
  productId: string;
  remainingStock: number;
  timestamp: string;
}

export type AppEvent =
  | OrderCreatedEvent
  | InventoryProductCreatedEvent
  | InventoryStockUpdatedEvent
  | InventoryLowStockEvent;
