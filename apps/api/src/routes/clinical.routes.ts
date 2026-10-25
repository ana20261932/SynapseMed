import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

// Encounters
router.post('/encounters', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse']), requireModule('clinical_notes'), async (req: any, res: any, next: any) => {
  try {
    const { patientId, appointmentId, practitionerUserId } = req.body;
    const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
    if (!patient) throw Errors.NOT_FOUND('Patient');
    const encounter = await prisma.encounter.create({ data: { practiceId: req.practiceId!, patientId, appointmentId, practitionerUserId: practitionerUserId ?? req.user!.sub } });
    res.status(201).json({ success: true, data: encounter } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/encounters', requireAuth, requirePracticeMembership(), requireModule('clinical_notes'), async (req: any, res: any, next: any) => {
  try {
    const encounters = await prisma.encounter.findMany({ where: { practiceId: req.practiceId! }, orderBy: { clinicalDate: 'desc' }, include: { patient: { select: { id: true, firstName: true, lastName: true } }, clinicalNotes: true } });
    res.json({ success: true, data: encounters } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Clinical notes
router.post('/encounters/:encounterId/notes', requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('clinical_notes'), async (req: any, res: any, next: any) => {
  try {
    const { content, aiGenerated } = req.body;
    const encounter = await prisma.encounter.findFirst({ where: { id: req.params.encounterId, practiceId: req.practiceId! } });
    if (!encounter) throw Errors.NOT_FOUND('Encounter');
    const note = await prisma.clinicalNote.create({ data: { encounterId: encounter.id, authorUserId: req.user!.sub, content, aiGenerated: aiGenerated ?? false, status: 'draft' } });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'clinical_note.create', resourceType: 'ClinicalNote', resourceId: note.id, metadata: { aiGenerated: note.aiGenerated } });
    res.status(201).json({ success: true, data: note } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/encounters/:encounterId/notes/:noteId/sign', requireAuth, requirePracticeMembership(['owner','practitioner']), requireModule('clinical_notes'), async (req: any, res: any, next: any) => {
  try {
    const note = await prisma.clinicalNote.findFirst({ where: { id: req.params.noteId, encounterId: req.params.encounterId, encounter: { practiceId: req.practiceId! } } });
    if (!note) throw Errors.NOT_FOUND('Clinical note');
    if (['signed','voided'].includes(note.status)) throw Errors.CONFLICT('Note is already signed or voided');
    const updated = await prisma.clinicalNote.update({ where: { id: note.id }, data: { status: 'signed', reviewedBy: req.user!.sub, reviewedAt: new Date(), signedAt: new Date() } });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'clinical_note.sign', resourceType: 'ClinicalNote', resourceId: note.id });
    res.json({ success: true, data: updated } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Prescriptions
router.post('/encounters/:encounterId/prescriptions', requireAuth, requirePracticeMembership(['owner','practitioner']), requireModule('prescriptions'), async (req: any, res: any, next: any) => {
  try {
    const { items, aiGenerated } = req.body;
    const encounter = await prisma.encounter.findFirst({ where: { id: req.params.encounterId, practiceId: req.practiceId! } });
    if (!encounter) throw Errors.NOT_FOUND('Encounter');
    const prescription = await prisma.prescription.create({ data: { encounterId: encounter.id, prescriberUserId: req.user!.sub, items: JSON.stringify(items), aiGenerated: aiGenerated ?? false, status: 'draft' } });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'prescription.create', resourceType: 'Prescription', resourceId: prescription.id, metadata: { aiGenerated: prescription.aiGenerated } });
    res.status(201).json({ success: true, data: prescription } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/encounters/:encounterId/prescriptions/:prescriptionId/sign', requireAuth, requirePracticeMembership(['owner','practitioner']), requireModule('prescriptions'), async (req: any, res: any, next: any) => {
  try {
    const rx = await prisma.prescription.findFirst({ where: { id: req.params.prescriptionId, encounterId: req.params.encounterId, encounter: { practiceId: req.practiceId! } } });
    if (!rx) throw Errors.NOT_FOUND('Prescription');
    if (['signed','dispensed','cancelled'].includes(rx.status)) throw Errors.CONFLICT('Cannot sign in current state');
    const updated = await prisma.prescription.update({ where: { id: rx.id }, data: { status: 'signed', reviewedBy: req.user!.sub, reviewedAt: new Date(), signedAt: new Date() } });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'prescription.sign', resourceType: 'Prescription', resourceId: rx.id });
    res.json({ success: true, data: updated } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
