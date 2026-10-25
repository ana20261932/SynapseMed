import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse, ModuleKey } from '@synapsemed/shared';

const router = Router();

// Create practice
router.post('/', requireAuth,
  [body('name').trim().notEmpty(), body('organisationType').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { name, organisationType, phone, email, address, timezone } = req.body;
      const userId = req.user!.sub;
      const result = await prisma.$transaction(async (tx: any) => {
        const org = await tx.organisation.create({ data: { name, type: organisationType } });
        const practice = await tx.practice.create({ data: { organisationId: org.id, name, phone, email, address, timezone: timezone ?? 'Africa/Johannesburg' } });
        await tx.practiceMembership.create({ data: { practiceId: practice.id, userId, role: 'owner', status: 'active', acceptedAt: new Date() } });
        const defaultModules: ModuleKey[] = ['scheduling', 'clinical_notes', 'billing'];
        await tx.moduleEntitlement.createMany({ data: defaultModules.map((moduleKey) => ({ practiceId: practice.id, moduleKey })) });
        return practice;
      });
      await audit({ actorId: userId, practiceId: result.id, action: 'practice.create', resourceType: 'Practice', resourceId: result.id, ipAddress: req.ip });
      res.status(201).json({ success: true, data: result } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// List user's practices
router.get('/', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const memberships = await prisma.practiceMembership.findMany({
      where: { userId: req.user!.sub, status: 'active' },
      include: { practice: { include: { organisation: true, moduleEntitlements: true } } },
    });
    res.json({ success: true, data: memberships } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Get one practice
router.get('/:practiceId', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const practice = await prisma.practice.findUnique({
      where: { id: req.practiceId! },
      include: { organisation: true, moduleEntitlements: true, practiceNumbers: true, specialtyConfig: true },
    });
    if (!practice) throw Errors.NOT_FOUND('Practice');
    res.json({ success: true, data: practice } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Update practice
router.patch('/:practiceId', requireAuth, requirePracticeMembership(['owner', 'admin']), async (req: any, res: any, next: any) => {
  try {
    const { name, phone, email, address, timezone } = req.body;
    const updated = await prisma.practice.update({ where: { id: req.practiceId! }, data: { name, phone, email, address, timezone } });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'practice.update', resourceType: 'Practice', resourceId: req.practiceId!, ipAddress: req.ip });
    res.json({ success: true, data: updated } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Toggle module entitlement
router.put('/:practiceId/modules/:moduleKey', requireAuth, requirePracticeMembership(['owner', 'admin']), async (req: any, res: any, next: any) => {
  try {
    const { moduleKey } = req.params;
    const { status } = req.body as { status: 'active' | 'inactive' };
    const entitlement = await prisma.moduleEntitlement.upsert({
      where: { practiceId_moduleKey: { practiceId: req.practiceId!, moduleKey } },
      create: { practiceId: req.practiceId!, moduleKey, status },
      update: { status, enabledAt: status === 'active' ? new Date() : undefined },
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'entitlement.changed', resourceType: 'ModuleEntitlement', resourceId: entitlement.id, metadata: { moduleKey, status } });
    res.json({ success: true, data: entitlement } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
