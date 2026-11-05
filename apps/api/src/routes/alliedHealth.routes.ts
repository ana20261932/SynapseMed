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
 * Allied health routes — configurable via SpecialtyConfiguration.
 * discipline examples: physiotherapy, occupational_therapy, chiropractic, dietetics, speech_therapy.
 */

router.get('/sessions', requireAuth, requirePracticeMembership(), requireModule('specialty_allied_health'), async (req: any, res: any, next: any) => {
  try {
    const where: any = { practiceId: req.practiceId! };
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.discipline) where.discipline = req.query.discipline;
    const sessions = await prisma.alliedHealthSession.findMany({ where, orderBy: { sessionDate: 'desc' }, take: 100 });
    res.json({ success: true, data: sessions } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/sessions',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse']), requireModule('specialty_allied_health'),
  [body('patientId').notEmpty(), body('discipline').notEmpty(), body('sessionType').notEmpty(), body('outcomeNotes').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { patientId, discipline, sessionType, outcomeNotes, encounterId, durationMinutes, goals, sessionDate } = req.body;
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
      const session = await prisma.alliedHealthSession.create({
        data: { practiceId: req.practiceId!, patientId, practitionerUserId: req.user!.sub, encounterId, discipline, sessionType, outcomeNotes, durationMinutes, goals, sessionDate: sessionDate ? new Date(sessionDate) : undefined, status: 'draft' },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'allied_health.session_create', resourceType: 'AlliedHealthSession', resourceId: session.id, metadata: { discipline, sessionType } });
      res.status(201).json({ success: true, data: session } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/sessions/:sessionId', requireAuth, requirePracticeMembership(), requireModule('specialty_allied_health'), async (req: any, res: any, next: any) => {
  try {
    const session = await prisma.alliedHealthSession.findFirst({ where: { id: req.params.sessionId, practiceId: req.practiceId! } });
    if (!session) throw Errors.NOT_FOUND('Allied health session');
    res.json({ success: true, data: session } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/sessions/:sessionId/sign',
  requireAuth, requirePracticeMembership(['owner','practitioner']), requireModule('specialty_allied_health'),
  async (req: any, res: any, next: any) => {
    try {
      const session = await prisma.alliedHealthSession.findFirst({ where: { id: req.params.sessionId, practiceId: req.practiceId! } });
      if (!session) throw Errors.NOT_FOUND('Allied health session');
      if (session.signedAt) throw Errors.CONFLICT('Session is already signed');
      const updated = await prisma.alliedHealthSession.update({ where: { id: session.id }, data: { status: 'signed', signedAt: new Date() } });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'allied_health.session_sign', resourceType: 'AlliedHealthSession', resourceId: session.id });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
