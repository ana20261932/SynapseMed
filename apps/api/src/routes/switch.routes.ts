import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router({ mergeParams: true });

/**
 * Switch routes — ALL transactions are MOCK/SIMULATED.
 * Real claims require: environment=production + contractApproved=true + ENABLE_REAL_CLAIM_SUBMISSION=true.
 * Never represent simulated events as real claim submissions.
 */

router.get('/connection', requireAuth, requirePracticeMembership(['owner','admin']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    res.json({ success: true, data: conn ?? null } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/events', requireAuth, requirePracticeMembership(['owner','admin','billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    if (!conn || conn.connectionStatus !== 'active') throw Errors.SWITCH_NOT_CONNECTED();
    // Real submissions blocked unless all three flags are set
    const enableReal = process.env.ENABLE_REAL_CLAIM_SUBMISSION === 'true' && conn.environment === 'production' && conn.contractApproved;
    if (enableReal) throw Errors.REAL_CLAIMS_DISABLED(); // guard — production path not implemented yet
    const { eventType, payload } = req.body;
    const event = await prisma.switchUsageEvent.create({
      data: { connectionId: conn.id, isMock: true, eventType, idempotencyKey: uuidv4(), status: 'simulated', payloadRef: payload ? `[mock-${uuidv4().slice(0,8)}]` : undefined },
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'switch.claim_submit', resourceType: 'SwitchUsageEvent', resourceId: event.id, metadata: { isMock: true, eventType } });
    res.status(201).json({ success: true, data: { ...event, _warning: 'SIMULATED TRANSACTION — not a real claim submission' } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/events', requireAuth, requirePracticeMembership(['owner','admin','billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    if (!conn) return res.json({ success: true, data: [] } satisfies ApiResponse);
    const events = await prisma.switchUsageEvent.findMany({ where: { connectionId: conn.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: events } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
