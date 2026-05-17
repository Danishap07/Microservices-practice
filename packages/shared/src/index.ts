export { getProducer, publishEvent, disconnectProducer } from './kafka/producer';
export { createConsumer } from './kafka/consumer';
export { getRedis, cacheGet, cacheSet } from './redis/client';
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalError,
} from './errors';
export { validateOrderInput, validateProductId } from './validation';
export { generateToken, verifyToken } from './auth/jwt';
export { authenticate, authorize } from './auth/middleware';
export { logger } from './logger';
export type { UserPayload, OrderCreatedEvent, AppEvent } from './types';
