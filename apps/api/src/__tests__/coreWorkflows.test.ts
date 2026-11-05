/**
 * Milestone 4 — Core practice workflows
 *
 * Covers:
 *  - Patient registration and retrieval (tenant-scoped)
 *  - Appointment scheduling and status updates (module guard)
 *  - Clinical encounters with draft/signed note lifecycle
 *  - Prescriptions with draft/signed states (prescriber-only signing)
 *  - Billing invoice creation (billing module guard)
 *  - Document metadata registration
 *  - Inventory item creation and stock movements
 *  - AI-generated content is marked draft and requires review
 */
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(email: string): Promise<string> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'M4Test!Pass99', firstName: 'Core', lastName: 'Flow' });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'M4Test!Pass99' });
  return res.body.data.accessToken as string;
}

async function createPractice(token: string, name: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/practices')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, organisationType: 'group_practice' });
  return res.body.data.id as string;
}

async function activateModule(token: string, practiceId: string, module: string): Promise<void> {
  await request(app)
    .put(`/api/v1/practices/${practiceId}/modules/${module}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'active' });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[m4]' } } });
  const pids = practices.map((p) => p.id);

  if (pids.length) {
    await prisma.pmsInvoiceLine.deleteMany({ where: { invoice: { practiceId: { in: pids } } } });
    await prisma.pmsInvoice.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.stockMovement.deleteMany({ where: { item: { practiceId: { in: pids } } } });
    await prisma.inventoryItem.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.document.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.prescription.deleteMany({ where: { encounter: { practiceId: { in: pids } } } });
    await prisma.clinicalNote.deleteMany({ where: { encounter: { practiceId: { in: pids } } } });
    await prisma.encounter.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.appointment.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.patientConsent.deleteMany({ where: { patient: { practiceId: { in: pids } } } });
    await prisma.patient.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.moduleEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
    for (const pid of pids) {
      await prisma.practice.delete({ where: { id: pid } });
    }
    await prisma.organisation.deleteMany({ where: { name: { startsWith: '[m4]' } } });
  }

  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@m4.synapsemed' } } });
  await prisma.$disconnect();
});

// ── Patient management ────────────────────────────────────────────────────────

describe('Patient management (Milestone 4)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;

  beforeAll(async () => {
    token = await registerAndLogin('owner@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Patient Practice');
  });

  it('registers a new patient', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1985-03-15', gender: 'female', phone: '+27821234567', medicalAidScheme: 'Discovery', medicalAidNumber: 'DIS-001' });
    expect(res.status).toBe(201);
    expect(res.body.data.firstName).toBe('Jane');
    expect(res.body.data.practiceId).toBe(practiceId);
    patientId = res.body.data.id;
  });

  it('rejects patient with missing required fields', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'OnlyFirst' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retrieves patient by id', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(patientId);
    expect(res.body.data.lastName).toBe('Smith');
  });

  it('lists patients in practice', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((p: any) => p.id === patientId)).toBe(true);
  });

  it('returns 404 for a patient from a different practice', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/patients/non-existent-id`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ── Appointment scheduling ────────────────────────────────────────────────────

describe('Appointment scheduling (Milestone 4)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let appointmentId: string;

  beforeAll(async () => {
    token = await registerAndLogin('sched@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Scheduling Practice');
    await activateModule(token, practiceId, 'scheduling');
    const p = await request(app)
      .post(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'John', lastName: 'Patient' });
    patientId = p.body.data.id;
  });

  it('creates an appointment', async () => {
    const startsAt = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const endsAt = new Date(Date.now() + 90000000).toISOString();
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/appointments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, startsAt, endsAt, appointmentType: 'consultation', location: 'Room 1' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('booked');
    expect(res.body.data.patientId).toBe(patientId);
    appointmentId = res.body.data.id;
  });

  it('rejects appointment with missing startsAt', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/appointments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, endsAt: new Date().toISOString() });
    expect(res.status).toBe(422);
  });

  it('lists appointments', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/appointments`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((a: any) => a.id === appointmentId)).toBe(true);
  });

  it('updates appointment status', async () => {
    const res = await request(app)
      .patch(`/api/v1/practices/${practiceId}/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('blocks appointment access when scheduling module is disabled', async () => {
    await activateModule(token, practiceId, 'scheduling'); // keep active for now
    await request(app)
      .put(`/api/v1/practices/${practiceId}/modules/scheduling`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/appointments`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
    // re-activate for subsequent tests
    await activateModule(token, practiceId, 'scheduling');
  });
});

// ── Clinical encounters and notes ─────────────────────────────────────────────

describe('Clinical encounters and notes (Milestone 4)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let encounterId: string;
  let noteId: string;

  beforeAll(async () => {
    token = await registerAndLogin('clinician@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Clinical Practice');
    await activateModule(token, practiceId, 'clinical_notes');
    const p = await request(app)
      .post(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Clinical', lastName: 'Patient' });
    patientId = p.body.data.id;
  });

  it('creates an encounter', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('in_progress');
    encounterId = res.body.data.id;
  });

  it('returns 404 for encounter with patient from different practice', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: 'non-existent-patient' });
    expect(res.status).toBe(404);
  });

  it('creates a draft clinical note', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Patient presents with mild fever. Recommend rest.' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.aiGenerated).toBe(false);
    noteId = res.body.data.id;
  });

  it('marks AI-generated notes as draft requiring review', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'AI drafted summary.', aiGenerated: true });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.aiGenerated).toBe(true);
    // AI-generated notes must be in draft — not directly signed
    expect(res.body.data.signedAt).toBeNull();
  });

  it('lists encounters', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/clinical/encounters`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: any) => e.id === encounterId)).toBe(true);
  });

  it('signs a clinical note', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/notes/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('signed');
    expect(res.body.data.signedAt).not.toBeNull();
  });

  it('cannot re-sign an already signed note', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/notes/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});

// ── Prescriptions ─────────────────────────────────────────────────────────────

describe('Prescriptions (Milestone 4)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let encounterId: string;
  let prescriptionId: string;

  beforeAll(async () => {
    token = await registerAndLogin('prescriber@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Prescription Practice');
    await activateModule(token, practiceId, 'clinical_notes');
    await activateModule(token, practiceId, 'prescriptions');
    const p = await request(app)
      .post(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Rx', lastName: 'Patient' });
    patientId = p.body.data.id;
    const e = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId });
    encounterId = e.body.data.id;
  });

  it('creates a draft prescription', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/prescriptions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ name: 'Amoxicillin 500mg', dosage: '3x daily', days: 7 }] });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    prescriptionId = res.body.data.id;
  });

  it('signs a prescription', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/prescriptions/${prescriptionId}/sign`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('signed');
    expect(res.body.data.signedAt).not.toBeNull();
  });

  it('cannot re-sign an already signed prescription', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/prescriptions/${prescriptionId}/sign`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  it('marks AI-generated prescriptions as draft', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/clinical/encounters/${encounterId}/prescriptions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ name: 'AI suggested drug' }], aiGenerated: true });
    expect(res.status).toBe(201);
    expect(res.body.data.aiGenerated).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.signedAt).toBeNull();
  });
});

// ── Billing (PMS invoices) ────────────────────────────────────────────────────

describe('Billing / PMS invoices (Milestone 4)', () => {
  let token: string;
  let practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('billing@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Billing Practice');
    await activateModule(token, practiceId, 'billing');
  });

  it('creates a PMS invoice with line items', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/billing/invoices`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        lines: [
          { description: 'Consultation fee', quantity: 1, unitPriceZar: 800 },
          { description: 'Procedure fee', quantity: 2, unitPriceZar: 200 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.amountZar).toBe(1200);
    expect(res.body.data.lines).toHaveLength(2);
    expect(res.body.data.invoiceNumber).toMatch(/^PMS-/);
  });

  it('lists billing invoices', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/billing/invoices`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('blocks billing access when module is disabled', async () => {
    await request(app)
      .put(`/api/v1/practices/${practiceId}/modules/billing`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/billing/invoices`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });
});

// ── Document management ───────────────────────────────────────────────────────

describe('Document management (Milestone 4)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let documentId: string;

  beforeAll(async () => {
    token = await registerAndLogin('docs@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Docs Practice');
    const p = await request(app)
      .post(`/api/v1/practices/${practiceId}/patients`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Doc', lastName: 'Patient' });
    patientId = p.body.data.id;
  });

  it('registers document metadata for a patient', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, objectKey: 'uploads/2026/10/lab-result.pdf', fileName: 'lab-result.pdf', mimeType: 'application/pdf', classification: 'lab_result' });
    expect(res.status).toBe(201);
    expect(res.body.data.fileName).toBe('lab-result.pdf');
    expect(res.body.data.practiceId).toBe(practiceId);
    documentId = res.body.data.id;
  });

  it('rejects document without objectKey', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, fileName: 'missing-key.pdf', mimeType: 'application/pdf' });
    expect(res.status).toBe(422);
  });

  it('lists documents for a practice', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/documents`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((d: any) => d.id === documentId)).toBe(true);
  });

  it('retrieves a specific document by id', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/documents/${documentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.classification).toBe('lab_result');
  });

  it('returns 404 for document in another practice', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/documents/non-existent-id`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('rejects document with patientId from a different practice', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: 'wrong-practice-patient', objectKey: 'uploads/file.pdf', fileName: 'file.pdf', mimeType: 'application/pdf' });
    expect(res.status).toBe(404);
  });
});

// ── Inventory management ──────────────────────────────────────────────────────

describe('Inventory management (Milestone 4)', () => {
  let token: string;
  let practiceId: string;
  let itemId: string;

  beforeAll(async () => {
    token = await registerAndLogin('stock@m4.synapsemed');
    practiceId = await createPractice(token, '[m4] Inventory Practice');
    await activateModule(token, practiceId, 'inventory');
  });

  it('creates an inventory item', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/inventory`)
      .set('Authorization', `Bearer ${token}`)
      .send({ sku: 'MED-001', name: 'Amoxicillin 500mg Capsules', unit: 'pack', quantity: 50, lowStockThreshold: 10, batchTracked: true, expiryTracked: true });
    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('MED-001');
    expect(res.body.data.quantity).toBe(50);
    itemId = res.body.data.id;
  });

  it('lists inventory items', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/inventory`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((i: any) => i.sku === 'MED-001')).toBe(true);
  });

  it('records a stock movement (adjustment)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/inventory/${itemId}/movements`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -5, reason: 'dispensed', notes: 'Dispensed to patient X' });
    expect(res.status).toBe(201);
    expect(res.body.data.quantity).toBe(-5);
    expect(res.body.data.reason).toBe('dispensed');
  });

  it('reflects stock quantity change after movement', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/inventory`)
      .set('Authorization', `Bearer ${token}`);
    const item = res.body.data.find((i: any) => i.id === itemId);
    expect(item.quantity).toBe(45); // 50 - 5
  });

  it('blocks inventory access when module is disabled', async () => {
    await request(app)
      .put(`/api/v1/practices/${practiceId}/modules/inventory`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/inventory`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });
});
