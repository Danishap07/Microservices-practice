import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[Inventory] ${req.method} ${req.url}`);
  next();
}
