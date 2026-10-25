import { Request, Response, NextFunction } from 'express';
import { PracticeRole } from '@synapsemed/shared';
import { prisma } from '../lib/prisma';
import { Errors } from '../lib/errors';

declare global {
  namespace Express {
    interface Request {
      practiceId?: string;
      practiceRole?: PracticeRole;
    }
  }
}

export function requirePracticeMembership(allowedRoles?: PracticeRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.sub;
    const practiceId = req.params.practiceId ?? req.practiceId;
    if (!userId || !practiceId) return next(Errors.UNAUTHORIZED());

    const membership = await prisma.practiceMembership.findUnique({
      where: { practiceId_userId: { practiceId, userId } },
    });
    if (!membership || membership.status !== 'active') return next(Errors.FORBIDDEN());
    if (allowedRoles && !allowedRoles.includes(membership.role as PracticeRole)) {
      return next(Errors.FORBIDDEN());
    }
    req.practiceId = practiceId;
    req.practiceRole = membership.role as PracticeRole;
    next();
  };
}

export function requireModule(moduleKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const practiceId = req.practiceId;
    if (!practiceId) return next(Errors.UNAUTHORIZED());
    const entitlement = await prisma.moduleEntitlement.findUnique({
      where: { practiceId_moduleKey: { practiceId, moduleKey } },
    });
    if (!entitlement || entitlement.status !== 'active') return next(Errors.MODULE_DISABLED(moduleKey));
    next();
  };
}
