import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router({ mergeParams: true });

router.get('/invoices', requireAuth, requirePracticeMembership(['owner','admin','billing_staff']), requireModule('billing'), async (req: any, res: any, next: any) => {
  try {
    const invoices = await prisma.pmsInvoice.findMany({ where: { practiceId: req.practiceId! }, include: { lines: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: invoices } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/invoices', requireAuth, requirePracticeMembership(['owner','admin','billing_staff']), requireModule('billing'), async (req: any, res: any, next: any) => {
  try {
    const { lines, periodStart, periodEnd, subscriptionId } = req.body as { lines: { description: string; quantity: number; unitPriceZar: number }[]; periodStart: string; periodEnd: string; subscriptionId?: string };
    const amountZar = lines.reduce((s: number, l: any) => s + l.unitPriceZar * l.quantity, 0);
    const vatZar = +(amountZar * 0.15).toFixed(2); // Verify current VAT rate before production
    const invoiceNumber = `PMS-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
    const invoice = await prisma.pmsInvoice.create({
      data: { practiceId: req.practiceId!, subscriptionId, invoiceNumber, amountZar, vatZar, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd), lines: { create: lines.map((l: any) => ({ description: l.description, quantity: l.quantity, unitPriceZar: l.unitPriceZar, totalZar: l.unitPriceZar * l.quantity })) } },
      include: { lines: true },
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'billing.invoice_create', resourceType: 'PmsInvoice', resourceId: invoice.id, metadata: { invoiceNumber, amountZar } });
    res.status(201).json({ success: true, data: invoice } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
