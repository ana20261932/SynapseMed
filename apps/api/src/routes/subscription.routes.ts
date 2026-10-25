import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.get('/plans', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceZar: 'asc' } });
    res.json({ success: true, data: plans } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/', requireAuth, requirePracticeMembership(['owner','admin']), async (req: any, res: any, next: any) => {
  try {
    const subscription = await prisma.subscription.findFirst({ where: { practiceId: req.practiceId! }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: subscription ?? null } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requirePracticeMembership(['owner','admin']), async (req: any, res: any, next: any) => {
  try {
    const { planId, paymentTokenId } = req.body as { planId: string; paymentTokenId?: string };
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return res.status(422).json({ success: false, error: { code: 'INVALID_PLAN', message: 'Plan not available' } });
    // No card required for free plan if price is 0
    if (plan.priceZar > 0 && !paymentTokenId) {
      return res.status(422).json({ success: false, error: { code: 'PAYMENT_REQUIRED', message: 'Payment method required for paid plans' } });
    }
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.billingPeriod === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);
    const subscription = await prisma.subscription.create({
      data: { practiceId: req.practiceId!, planId, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd },
      include: { plan: true },
    });
    if (plan.priceZar === 0) {
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'subscription.activate_free', resourceType: 'Subscription', resourceId: subscription.id });
    } else {
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'subscription.activate', resourceType: 'Subscription', resourceId: subscription.id, metadata: { planId } });
    }
    res.status(201).json({ success: true, data: subscription } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
