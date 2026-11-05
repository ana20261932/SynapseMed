import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

// ── Odontogram charts ─────────────────────────────────────────────────────────

router.get('/charts', requireAuth, requirePracticeMembership(), requireModule('specialty_dental'), async (req: any, res: any, next: any) => {
  try {
    const where: any = { practiceId: req.practiceId! };
    if (req.query.patientId) where.patientId = req.query.patientId;
    const charts = await prisma.odontogramChart.findMany({ where, include: { toothEntries: true }, orderBy: { chartDate: 'desc' }, take: 50 });
    res.json({ success: true, data: charts } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/charts',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('specialty_dental'),
  [body('patientId').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { patientId, notes, toothEntries = [] } = req.body;
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
      const chart = await prisma.odontogramChart.create({
        data: {
          practiceId: req.practiceId!, patientId, authorUserId: req.user!.sub, notes,
          toothEntries: { create: (toothEntries as any[]).map((t: any) => ({ toothNumber: t.toothNumber, surface: t.surface, condition: t.condition, notes: t.notes })) },
        },
        include: { toothEntries: true },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'dental.chart_create', resourceType: 'OdontogramChart', resourceId: chart.id });
      res.status(201).json({ success: true, data: chart } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/charts/:chartId', requireAuth, requirePracticeMembership(), requireModule('specialty_dental'), async (req: any, res: any, next: any) => {
  try {
    const chart = await prisma.odontogramChart.findFirst({ where: { id: req.params.chartId, practiceId: req.practiceId! }, include: { toothEntries: true, treatmentPlans: { include: { items: true } } } });
    if (!chart) throw Errors.NOT_FOUND('Odontogram chart');
    res.json({ success: true, data: chart } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Treatment plans ───────────────────────────────────────────────────────────

router.post('/charts/:chartId/treatment-plans',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('specialty_dental'),
  async (req: any, res: any, next: any) => {
    try {
      const chart = await prisma.odontogramChart.findFirst({ where: { id: req.params.chartId, practiceId: req.practiceId! } });
      if (!chart) throw Errors.NOT_FOUND('Odontogram chart');
      const { notes, items = [] } = req.body;
      const plan = await prisma.treatmentPlan.create({
        data: {
          chartId: chart.id, practiceId: req.practiceId!, patientId: chart.patientId,
          authorUserId: req.user!.sub, notes, status: 'draft',
          items: { create: (items as any[]).map((i: any) => ({ toothNumber: i.toothNumber, procedureCode: i.procedureCode, description: i.description, estimatedFeeZar: i.estimatedFeeZar ?? 0 })) },
        },
        include: { items: true },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'dental.plan_create', resourceType: 'TreatmentPlan', resourceId: plan.id });
      res.status(201).json({ success: true, data: plan } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.patch('/charts/:chartId/treatment-plans/:planId/status',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('specialty_dental'),
  async (req: any, res: any, next: any) => {
    try {
      const plan = await prisma.treatmentPlan.findFirst({ where: { id: req.params.planId, chartId: req.params.chartId, practiceId: req.practiceId! } });
      if (!plan) throw Errors.NOT_FOUND('Treatment plan');
      const { status } = req.body;
      const updated = await prisma.treatmentPlan.update({ where: { id: plan.id }, data: { status } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
