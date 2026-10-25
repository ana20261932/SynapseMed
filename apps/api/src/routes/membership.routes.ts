import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse, PracticeRole } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePracticeMembership(['owner', 'admin']), async (req: any, res: any, next: any) => {
  try {
    const members = await prisma.practiceMembership.findMany({
      where: { practiceId: req.practiceId! },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json({ success: true, data: members } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requirePracticeMembership(['owner', 'admin']),
  [body('email').isEmail().normalizeEmail(), body('role').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { email, role } = req.body as { email: string; role: PracticeRole };
      const targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) throw Errors.NOT_FOUND('User with that email');
      const existing = await prisma.practiceMembership.findUnique({ where: { practiceId_userId: { practiceId: req.practiceId!, userId: targetUser.id } } });
      if (existing && existing.status !== 'removed') throw Errors.CONFLICT('User is already a member');
      const membership = await prisma.practiceMembership.upsert({
        where: { practiceId_userId: { practiceId: req.practiceId!, userId: targetUser.id } },
        create: { practiceId: req.practiceId!, userId: targetUser.id, role, status: 'invited' },
        update: { role, status: 'invited', revokedAt: null },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'membership.invite', resourceType: 'PracticeMembership', resourceId: membership.id, metadata: { invitedUserId: targetUser.id, role }, ipAddress: req.ip });
      res.status(201).json({ success: true, data: membership } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.post('/accept', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const membership = await prisma.practiceMembership.findUnique({ where: { practiceId_userId: { practiceId: req.params.practiceId, userId: req.user!.sub } } });
    if (!membership || membership.status !== 'invited') throw Errors.NOT_FOUND('Pending invitation');
    const updated = await prisma.practiceMembership.update({ where: { id: membership.id }, data: { status: 'active', acceptedAt: new Date() } });
    await audit({ actorId: req.user!.sub, practiceId: req.params.practiceId, action: 'membership.accept', resourceType: 'PracticeMembership', resourceId: updated.id, ipAddress: req.ip });
    res.json({ success: true, data: updated } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.delete('/:userId', requireAuth, requirePracticeMembership(['owner', 'admin']), async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.params;
    if (userId === req.user!.sub) throw Errors.CONFLICT('Cannot remove yourself');
    const membership = await prisma.practiceMembership.findUnique({ where: { practiceId_userId: { practiceId: req.practiceId!, userId } } });
    if (!membership) throw Errors.NOT_FOUND('Membership');
    await prisma.practiceMembership.update({ where: { id: membership.id }, data: { status: 'removed', revokedAt: new Date() } });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'membership.revoke', resourceType: 'PracticeMembership', resourceId: membership.id, metadata: { revokedUserId: userId }, ipAddress: req.ip });
    res.json({ success: true, data: { message: 'Member removed' } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
