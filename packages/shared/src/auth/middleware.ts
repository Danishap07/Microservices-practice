import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { UserPayload } from '../types';
import { UnauthorizedError, ForbiddenError } from '../errors';

declare module 'express' {
  interface Request {
    user?: UserPayload;
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid token');
  }

  const token = authHeader.split(' ')[1];
  req.user = verifyToken(token);
  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions. Required role: ' + roles.join(' or '));
    }
    next();
  };
}
