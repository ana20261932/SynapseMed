import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePracticeMembership(), requireModule('scheduling'), async (req: any, res: any, next: any) => {
  try {
    const appointments = await prisma.appointment.findMany({ where: { practiceId: req.practiceId! }, orderBy: { startsAt: 'asc' }, include: { patient: { select: { id: true, firstName: true, lastName: true } } } });
    res.json({ success: true, data: appointments } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']), requireModule('scheduling'),
  [body('patientId').notEmpty(), body('startsAt').isISO8601(), body('endsAt').isISO8601()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { patientId, practitionerUserId, appointmentType, location, startsAt, endsAt, notes } = req.body;
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
      const appointment = await prisma.appointment.create({ data: { practiceId: req.practiceId!, patientId, practitionerUserId, appointmentType, location, startsAt: new Date(startsAt), endsAt: new Date(endsAt), notes } });
      res.status(201).json({ success: true, data: appointment } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.patch('/:appointmentId/status', requireAuth, requirePracticeMembership(), requireModule('scheduling'), async (req: any, res: any, next: any) => {
  try {
    const { status } = req.body;
    const appt = await prisma.appointment.findFirst({ where: { id: req.params.appointmentId, practiceId: req.practiceId! } });
    if (!appt) throw Errors.NOT_FOUND('Appointment');
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status } });
    res.json({ success: true, data: updated } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
