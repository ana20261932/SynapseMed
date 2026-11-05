import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

// Unified patient encounter timeline
router.get('/patients/:patientId/timeline', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
    if (!patient) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } });
    }

    const [appointments, encounters, documents] = await Promise.all([
      prisma.appointment.findMany({ where: { patientId, practiceId: req.practiceId! }, orderBy: { startsAt: 'desc' }, take: 50 }),
      prisma.encounter.findMany({ where: { patientId, practiceId: req.practiceId! }, orderBy: { clinicalDate: 'desc' }, include: { clinicalNotes: true }, take: 50 }),
      prisma.document.findMany({ where: { patientId, practiceId: req.practiceId! }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);

    let claims: any[] = [];
    let invoices: any[] = [];
    try {
      claims = await (prisma as any).claim.findMany({ where: { practiceId: req.practiceId! }, orderBy: { createdAt: 'desc' }, take: 50 });
    } catch (e) {
      claims = [];
    }
    try {
      invoices = await prisma.pmsInvoice.findMany({ where: { practiceId: req.practiceId! }, orderBy: { createdAt: 'desc' }, take: 50 });
    } catch (e) {
      invoices = [];
    }

    const timeline: any[] = [];

    appointments.forEach((a: any) => {
      timeline.push({
        id: `appt_${a.id}`,
        type: 'appointment',
        timestamp: a.startsAt.toISOString(),
        title: `Appointment - ${a.appointmentType || 'General'}`,
        description: a.notes || `Status: ${a.status}`,
        source: { type: 'appointment', id: a.id },
        permissions: { canViewClinical: true, canViewBilling: false },
      });
    });

    encounters.forEach((e: any) => {
      timeline.push({
        id: `enc_${e.id}`,
        type: 'encounter',
        timestamp: e.clinicalDate.toISOString(),
        title: 'Clinical Encounter',
        description: `${e.clinicalNotes?.length || 0} note(s)`,
        source: { type: 'encounter', id: e.id },
        permissions: { canViewClinical: true, canViewBilling: false },
      });
    });

    documents.forEach((d: any) => {
      timeline.push({
        id: `doc_${d.id}`,
        type: 'document',
        timestamp: d.createdAt.toISOString(),
        title: d.fileName,
        description: `Document uploaded - ${d.classification || 'general'}`,
        source: { type: 'document', id: d.id },
        permissions: { canViewClinical: true, canViewBilling: false },
      });
    });

    claims.forEach((c: any) => {
      timeline.push({
        id: `claim_${c.id}`,
        type: 'claim',
        timestamp: c.createdAt.toISOString(),
        title: `Claim ${c.claimReference}`,
        description: `Status: ${c.status} - SIMULATED`,
        source: { type: 'claim', id: c.id },
        permissions: { canViewClinical: false, canViewBilling: true },
        simulated: true,
      });
    });

    invoices.forEach((inv: any) => {
      timeline.push({
        id: `inv_${inv.id}`,
        type: 'invoice',
        timestamp: inv.createdAt.toISOString(),
        title: `Invoice ${inv.invoiceNumber}`,
        description: `Amount: R${inv.totalZar?.toFixed(2) || '0.00'} - Status: ${inv.status}`,
        source: { type: 'invoice', id: inv.id },
        permissions: { canViewClinical: false, canViewBilling: true },
      });
    });

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ 
      success: true, 
      data: {
        patient: { id: patient.id, firstName: patient.firstName, lastName: patient.lastName },
        timeline,
        timezone: 'Africa/Johannesburg',
      }
    } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
