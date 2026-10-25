import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const patients = await prisma.patient.findMany({ where: { practiceId: req.practiceId!, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: patients } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']),
  [body('firstName').trim().notEmpty(), body('lastName').trim().notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { firstName, lastName, dateOfBirth, gender, idNumber, phone, email, address, medicalAidScheme, medicalAidNumber } = req.body;
      const patient = await prisma.patient.create({ data: { practiceId: req.practiceId!, firstName, lastName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, gender, idNumber, phone, email, address, medicalAidScheme, medicalAidNumber } });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'patient.create', resourceType: 'Patient', resourceId: patient.id, ipAddress: req.ip });
      res.status(201).json({ success: true, data: patient } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/:patientId', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { id: req.params.patientId, practiceId: req.practiceId! }, include: { consents: true } });
    if (!patient) throw Errors.NOT_FOUND('Patient');
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'patient.view', resourceType: 'Patient', resourceId: patient.id, ipAddress: req.ip });
    res.json({ success: true, data: patient } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
