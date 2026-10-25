import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { Errors } from '../lib/errors';

const router = Router({ mergeParams: true });

// Provider-hosted/tokenized flow simulation - no raw card data stored
router.post('/methods/tokenize', requireAuth, requirePracticeMembership(['owner','admin']), async (req: any, res: any, next: any) => {
  try {
    const { providerName = 'mock', last4, brand, expiryMonth, expiryYear } = req.body;
    // In real flow, token comes from provider; here we generate a mock token
    const token = `tok_mock_${Date.now().toString(36)}`;
    const pm = await prisma.paymentMethodToken.create({
      data: { practiceId: req.practiceId!, providerName, token, last4, brand, expiryMonth, expiryYear, isDefault: true },
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'payment.method_tokenized', resourceType: 'PaymentMethodToken', resourceId: pm.id, metadata: { brand, last4 } });
    res.status(201).json({ success: true, data: pm } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Webhook - verify signatures in production; simulate here
router.post('/webhooks/:provider', async (req: any, res: any, next: any) => {
  try {
    const { provider } = req.params;
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
    if (process.env.NODE_ENV === 'production' && !signature) throw Errors.FORBIDDEN();
    // Idempotent handling by providerEventId
    const { providerEventId, eventType, practiceId, amountZar, currency = 'ZAR', status } = req.body;
    if (!providerEventId) { const e:any = Errors.VALIDATION ? Errors.VALIDATION({}) : Errors.FORBIDDEN(); throw e; }
    const existing = await prisma.paymentEvent.findUnique({ where: { providerEventId } });
    if (existing) {
      return res.json({ success: true, data: { ...existing, _idempotent: true } } as any);
    }
    const ev = await prisma.paymentEvent.create({
      data: { practiceId, providerEventId, providerName: provider, eventType, status, amountZar, currency, rawPayload: JSON.stringify(req.body).slice(0, 1000) },
    });
    await audit({ practiceId, action: 'payment.webhook_received', resourceType: 'PaymentEvent', resourceId: ev.id, metadata: { provider, eventType, status } });
    res.status(201).json({ success: true, data: ev } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
