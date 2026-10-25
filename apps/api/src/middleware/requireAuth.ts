import { Request, Response, NextFunction } from 'express';
import { Errors } from '../lib/errors';
import { verifyToken, JwtPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(Errors.UNAUTHORIZED());
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(Errors.TOKEN_EXPIRED());
  }
}
