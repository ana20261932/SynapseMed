import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePracticeMembership(), requireModule('inventory'), async (req: any, res: any, next: any) => {
  try {
    const items = await prisma.inventoryItem.findMany({ where: { practiceId: req.practiceId! }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: items } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requirePracticeMembership(['owner','admin','stock_manager']), requireModule('inventory'), async (req: any, res: any, next: any) => {
  try {
    const { sku, name, description, unit, quantity, lowStockThreshold, batchTracked, expiryTracked } = req.body;
    const item = await prisma.inventoryItem.create({ data: { practiceId: req.practiceId!, sku, name, description, unit, quantity: quantity ?? 0, lowStockThreshold: lowStockThreshold ?? 5, batchTracked, expiryTracked } });
    res.status(201).json({ success: true, data: item } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/:itemId/movements', requireAuth, requirePracticeMembership(['owner','admin','stock_manager']), requireModule('inventory'), async (req: any, res: any, next: any) => {
  try {
    const { quantity, reason, batchNumber, expiryDate, notes } = req.body;
    const item = await prisma.inventoryItem.findFirst({ where: { id: req.params.itemId, practiceId: req.practiceId! } });
    if (!item) throw Errors.NOT_FOUND('Inventory item');
    const movement = await prisma.$transaction(async (tx: any) => {
      const mv = await tx.stockMovement.create({ data: { itemId: item.id, quantity, reason, authorUserId: req.user!.sub, batchNumber, expiryDate: expiryDate ? new Date(expiryDate) : undefined, notes } });
      await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: { increment: quantity } } });
      return mv;
    });
    res.status(201).json({ success: true, data: movement } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
