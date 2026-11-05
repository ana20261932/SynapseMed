import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { getERPNextAdapter } from '../lib/erpnext/MockERPNextAdapter';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.get('/health', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const result = await adapter.ping();
    res.json({ success: true, data: { ...result, provider: adapter.providerName, isMock: adapter.isMock } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/patients', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']), requireModule('patients'), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const patient = await adapter.createPatient(req.body);
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'patient.create' as any, resourceType: 'Patient', resourceId: patient.name, metadata: { provider: adapter.providerName, erpnext: true } });
    res.status(201).json({ success: true, data: patient } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/patients/:patientId', requireAuth, requirePracticeMembership(), requireModule('patients'), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const patient = await adapter.getPatient(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'ERPNext patient not found' } });
    res.json({ success: true, data: patient } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/appointments', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']), requireModule('appointments'), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const appointment = await adapter.createAppointment(req.body);
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'appointment.create' as any, resourceType: 'Appointment', resourceId: appointment.name, metadata: { provider: adapter.providerName, erpnext: true } });
    res.status(201).json({ success: true, data: appointment } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/appointments', requireAuth, requirePracticeMembership(), requireModule('appointments'), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const appointments = await adapter.getAppointments(req.query as any);
    res.json({ success: true, data: appointments } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/encounters', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse']), requireModule('clinical_notes'), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const encounter = await adapter.createEncounter(req.body);
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'clinical_note.create' as any, resourceType: 'ClinicalNote', resourceId: encounter.name, metadata: { provider: adapter.providerName, erpnext: true } });
    res.status(201).json({ success: true, data: encounter } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/invoices', requireAuth, requirePracticeMembership(['owner','admin']), requireModule('billing'), async (req: any, res: any, next: any) => {
  try {
    const adapter = getERPNextAdapter();
    const invoice = await adapter.createSalesInvoice(req.body);
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'invoice.create' as any, resourceType: 'PmsInvoice', resourceId: invoice.name, metadata: { provider: adapter.providerName, erpnext: true } });
    res.status(201).json({ success: true, data: invoice } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
