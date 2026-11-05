import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

/**
 * Radiology routes — this service stores ORDER and REPORT metadata only.
 * Actual DICOM images are managed by an external imaging system.
 * externalStudyRef holds the reference to that system — no images are stored here.
 */

// ── Orders ────────────────────────────────────────────────────────────────────

router.get('/orders', requireAuth, requirePracticeMembership(), requireModule('specialty_radiology'), async (req: any, res: any, next: any) => {
  try {
    const where: any = { practiceId: req.practiceId! };
    if (req.query.patientId) where.patientId = req.query.patientId;
    const orders = await prisma.radiologyOrder.findMany({ where, include: { report: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: orders } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/orders',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('specialty_radiology'),
  [body('patientId').notEmpty(), body('modality').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { patientId, modality, bodyPart, clinicalIndication, urgency, encounterId } = req.body;
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
      const order = await prisma.radiologyOrder.create({
        data: { practiceId: req.practiceId!, patientId, requestingUserId: req.user!.sub, encounterId, modality, bodyPart, clinicalIndication, urgency: urgency ?? 'routine' },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'radiology.order_create', resourceType: 'RadiologyOrder', resourceId: order.id, metadata: { modality, urgency } });
      res.status(201).json({ success: true, data: order } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/orders/:orderId', requireAuth, requirePracticeMembership(), requireModule('specialty_radiology'), async (req: any, res: any, next: any) => {
  try {
    const order = await prisma.radiologyOrder.findFirst({ where: { id: req.params.orderId, practiceId: req.practiceId! }, include: { report: true } });
    if (!order) throw Errors.NOT_FOUND('Radiology order');
    res.json({ success: true, data: order } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Reports ───────────────────────────────────────────────────────────────────

router.post('/orders/:orderId/report',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('specialty_radiology'),
  [body('reportText').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const order = await prisma.radiologyOrder.findFirst({ where: { id: req.params.orderId, practiceId: req.practiceId! } });
      if (!order) throw Errors.NOT_FOUND('Radiology order');
      const existing = await prisma.radiologyReport.findUnique({ where: { orderId: order.id } });
      if (existing) throw Errors.CONFLICT('Report already exists for this order');
      const { reportText, radiologistName, aiGenerated } = req.body;
      const report = await prisma.radiologyReport.create({ data: { orderId: order.id, reportText, radiologistName, aiGenerated: aiGenerated ?? false, status: 'draft' } });
      await prisma.radiologyOrder.update({ where: { id: order.id }, data: { status: 'reported' } });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'radiology.report_create', resourceType: 'RadiologyReport', resourceId: report.id, metadata: { aiGenerated: report.aiGenerated } });
      res.status(201).json({ success: true, data: report } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.post('/orders/:orderId/report/sign',
  requireAuth, requirePracticeMembership(['owner','practitioner']), requireModule('specialty_radiology'),
  async (req: any, res: any, next: any) => {
    try {
      const order = await prisma.radiologyOrder.findFirst({ where: { id: req.params.orderId, practiceId: req.practiceId! } });
      if (!order) throw Errors.NOT_FOUND('Radiology order');
      const report = await prisma.radiologyReport.findUnique({ where: { orderId: order.id } });
      if (!report) throw Errors.NOT_FOUND('Radiology report');
      if (report.signedAt) throw Errors.CONFLICT('Report is already signed');
      const updated = await prisma.radiologyReport.update({ where: { id: report.id }, data: { status: 'signed', reviewedBy: req.user!.sub, reviewedAt: new Date(), signedAt: new Date() } });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'radiology.report_sign', resourceType: 'RadiologyReport', resourceId: report.id });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
