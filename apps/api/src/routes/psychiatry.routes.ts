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
 * Psychiatry / Mental-health routes.
 * MentalHealthRecord.accessRestricted = true by default.
 * Only roles: owner, practitioner may read restricted records.
 * All access is audit-logged.
 */

const RESTRICTED_ROLES = ['owner', 'practitioner'] as const;

async function assertMhAccess(req: any, next: any): Promise<boolean> {
  const role = req.practiceRole as string;
  if (!RESTRICTED_ROLES.includes(role as any)) {
    next(Errors.FORBIDDEN());
    return false;
  }
  return true;
}

// ── Mental health records ─────────────────────────────────────────────────────

router.get('/records', requireAuth, requirePracticeMembership(), requireModule('specialty_psychiatry'), async (req: any, res: any, next: any) => {
  try {
    if (!await assertMhAccess(req, next)) return;
    const where: any = { practiceId: req.practiceId! };
    if (req.query.patientId) where.patientId = req.query.patientId;
    const records = await prisma.mentalHealthRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'psychiatry.records_list', resourceType: 'MentalHealthRecord', metadata: { patientId: req.query.patientId } });
    res.json({ success: true, data: records } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/records',
  requireAuth, requirePracticeMembership(['owner', 'practitioner']), requireModule('specialty_psychiatry'),
  [body('patientId').notEmpty(), body('recordType').notEmpty(), body('content').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { patientId, recordType, content, encounterId, consentRef, aiGenerated } = req.body;
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
      const record = await prisma.mentalHealthRecord.create({
        data: { practiceId: req.practiceId!, patientId, authorUserId: req.user!.sub, recordType, content, encounterId, consentRef, aiGenerated: aiGenerated ?? false, accessRestricted: true, status: 'draft' },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'psychiatry.record_create', resourceType: 'MentalHealthRecord', resourceId: record.id, metadata: { recordType, aiGenerated: record.aiGenerated } });
      res.status(201).json({ success: true, data: record } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/records/:recordId', requireAuth, requirePracticeMembership(), requireModule('specialty_psychiatry'), async (req: any, res: any, next: any) => {
  try {
    if (!await assertMhAccess(req, next)) return;
    const record = await prisma.mentalHealthRecord.findFirst({ where: { id: req.params.recordId, practiceId: req.practiceId! } });
    if (!record) throw Errors.NOT_FOUND('Mental health record');
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'psychiatry.record_view', resourceType: 'MentalHealthRecord', resourceId: record.id });
    res.json({ success: true, data: record } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/records/:recordId/sign',
  requireAuth, requirePracticeMembership(['owner', 'practitioner']), requireModule('specialty_psychiatry'),
  async (req: any, res: any, next: any) => {
    try {
      const record = await prisma.mentalHealthRecord.findFirst({ where: { id: req.params.recordId, practiceId: req.practiceId! } });
      if (!record) throw Errors.NOT_FOUND('Mental health record');
      if (record.signedAt) throw Errors.CONFLICT('Record is already signed');
      const updated = await prisma.mentalHealthRecord.update({ where: { id: record.id }, data: { status: 'signed', reviewedBy: req.user!.sub, reviewedAt: new Date(), signedAt: new Date() } });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'psychiatry.record_sign', resourceType: 'MentalHealthRecord', resourceId: record.id });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
