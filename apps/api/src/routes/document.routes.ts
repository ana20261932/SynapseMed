import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

// List documents for a practice (optionally filtered by patient)
router.get('/', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const where: any = { practiceId: req.practiceId! };
    if (req.query.patientId) where.patientId = req.query.patientId;
    const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: docs } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Register document metadata (actual file upload is handled by object storage outside this service)
router.post('/', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']), async (req: any, res: any, next: any) => {
  try {
    const { patientId, encounterId, objectKey, fileName, mimeType, classification, retentionPolicy } = req.body;
    if (!objectKey || !fileName || !mimeType) {
      throw Errors.VALIDATION({ general: ['objectKey, fileName and mimeType are required'] });
    }
    // If patientId supplied, verify it belongs to this practice
    if (patientId) {
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
    }
    const doc = await prisma.document.create({
      data: { practiceId: req.practiceId!, patientId, encounterId, objectKey, fileName, mimeType, classification, retentionPolicy: retentionPolicy ?? 'standard', uploadedBy: req.user!.sub },
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'document.register', resourceType: 'Document', resourceId: doc.id, metadata: { fileName, mimeType, classification } });
    res.status(201).json({ success: true, data: doc } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/:documentId', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const doc = await prisma.document.findFirst({ where: { id: req.params.documentId, practiceId: req.practiceId! } });
    if (!doc) throw Errors.NOT_FOUND('Document');
    res.json({ success: true, data: doc } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
