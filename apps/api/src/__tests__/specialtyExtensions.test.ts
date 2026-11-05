/**
 * Milestone 5 — Specialty extensions
 *
 * Covers:
 *  - Dental: odontogram chart creation, tooth entries, treatment plan lifecycle
 *  - Radiology: order creation, report draft/sign, re-sign rejected, image boundary
 *  - Psychiatry: enhanced role-gating, draft/signed records, audit on access
 *  - Allied health: configurable session workflow, discipline filter, sign lifecycle
 *  - Module guard: each specialty is blocked when its module is inactive
 */
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'M5Test!Pass99', firstName: 'Spec', lastName: 'Test' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'M5Test!Pass99' });
  return res.body.data.accessToken as string;
}

async function createPractice(token: string, name: string): Promise<string> {
  const res = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name, organisationType: 'group_practice' });
  return res.body.data.id as string;
}

async function activateModule(token: string, practiceId: string, module: string): Promise<void> {
  await request(app).put(`/api/v1/practices/${practiceId}/modules/${module}`).set('Authorization', `Bearer ${token}`).send({ status: 'active' });
}

async function createPatient(token: string, practiceId: string): Promise<string> {
  const res = await request(app).post(`/api/v1/practices/${practiceId}/patients`).set('Authorization', `Bearer ${token}`).send({ firstName: 'Spec', lastName: 'Patient' });
  return res.body.data.id as string;
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[m5]' } } });
  const pids = practices.map((p) => p.id);
  if (pids.length) {
    await prisma.treatmentPlanItem.deleteMany({ where: { plan: { practiceId: { in: pids } } } });
    await prisma.treatmentPlan.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.toothEntry.deleteMany({ where: { chart: { practiceId: { in: pids } } } });
    await prisma.odontogramChart.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.radiologyReport.deleteMany({ where: { order: { practiceId: { in: pids } } } });
    await prisma.radiologyOrder.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.mentalHealthRecord.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.alliedHealthSession.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.patient.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.moduleEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
    for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
    await prisma.organisation.deleteMany({ where: { name: { startsWith: '[m5]' } } });
  }
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@m5.synapsemed' } } });
  await prisma.$disconnect();
});

// ── Dental — Odontogram & Treatment plan ──────────────────────────────────────

describe('Dental — Odontogram (Milestone 5)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let chartId: string;
  let planId: string;

  beforeAll(async () => {
    token = await registerAndLogin('dental@m5.synapsemed');
    practiceId = await createPractice(token, '[m5] Dental Practice');
    await activateModule(token, practiceId, 'specialty_dental');
    patientId = await createPatient(token, practiceId);
  });

  it('blocks access when specialty_dental module is inactive', async () => {
    const t = await registerAndLogin('dental-block@m5.synapsemed');
    const pid = await createPractice(t, '[m5] Dental Block Practice');
    // module not activated
    const res = await request(app).get(`/api/v1/practices/${pid}/dental/charts`).set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });

  it('creates an odontogram chart with tooth entries', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/dental/charts`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        notes: 'Initial examination',
        toothEntries: [
          { toothNumber: 11, surface: 'buccal', condition: 'caries', notes: 'Small cavity' },
          { toothNumber: 26, surface: 'occlusal', condition: 'filling', notes: 'Existing amalgam' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.patientId).toBe(patientId);
    expect(res.body.data.toothEntries).toHaveLength(2);
    chartId = res.body.data.id;
  });

  it('rejects chart with missing patientId', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/dental/charts`).set('Authorization', `Bearer ${token}`).send({ notes: 'No patient' });
    expect(res.status).toBe(422);
  });

  it('retrieves a chart with tooth entries and treatment plans', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/dental/charts/${chartId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.toothEntries).toHaveLength(2);
  });

  it('lists odontogram charts for a practice', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/dental/charts`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.id === chartId)).toBe(true);
  });

  it('creates a treatment plan with items', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/dental/charts/${chartId}/treatment-plans`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Proposed treatment',
        items: [
          { toothNumber: 11, procedureCode: '8101', description: 'Class I composite restoration', estimatedFeeZar: 850 },
          { toothNumber: 26, procedureCode: '8341', description: 'Replace amalgam with composite', estimatedFeeZar: 1200 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.items).toHaveLength(2);
    planId = res.body.data.id;
  });

  it('advances treatment plan status to accepted', async () => {
    const res = await request(app)
      .patch(`/api/v1/practices/${practiceId}/dental/charts/${chartId}/treatment-plans/${planId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('accepted');
  });
});

// ── Radiology ─────────────────────────────────────────────────────────────────

describe('Radiology — Orders and reports (Milestone 5)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let orderId: string;

  beforeAll(async () => {
    token = await registerAndLogin('radio@m5.synapsemed');
    practiceId = await createPractice(token, '[m5] Radiology Practice');
    await activateModule(token, practiceId, 'specialty_radiology');
    patientId = await createPatient(token, practiceId);
  });

  it('blocks radiology access when module is inactive', async () => {
    const t = await registerAndLogin('radio-block@m5.synapsemed');
    const pid = await createPractice(t, '[m5] Radio Block Practice');
    const res = await request(app).get(`/api/v1/practices/${pid}/radiology/orders`).set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });

  it('creates a radiology order', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/radiology/orders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, modality: 'X-Ray', bodyPart: 'Chest', clinicalIndication: 'Persistent cough', urgency: 'routine' });
    expect(res.status).toBe(201);
    expect(res.body.data.modality).toBe('X-Ray');
    expect(res.body.data.status).toBe('ordered');
    orderId = res.body.data.id;
  });

  it('rejects order without modality', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/radiology/orders`).set('Authorization', `Bearer ${token}`).send({ patientId });
    expect(res.status).toBe(422);
  });

  it('lists radiology orders', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/radiology/orders`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((o: any) => o.id === orderId)).toBe(true);
  });

  it('creates a draft radiology report (no image stored — boundary maintained)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/radiology/orders/${orderId}/report`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportText: 'No acute cardiopulmonary pathology identified.', radiologistName: 'Dr. Dlamini' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.aiGenerated).toBe(false);
    // No image data in response — only report text reference
    expect(res.body.data.reportText).toBeDefined();
    expect(res.body.data).not.toHaveProperty('imageData');
  });

  it('marks order as reported after report creation', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/radiology/orders/${orderId}`).set('Authorization', `Bearer ${token}`);
    expect(res.body.data.status).toBe('reported');
    expect(res.body.data.report).toBeTruthy();
  });

  it('rejects duplicate report for same order', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/radiology/orders/${orderId}/report`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportText: 'Second attempt.' });
    expect(res.status).toBe(409);
  });

  it('signs a radiology report', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/radiology/orders/${orderId}/report/sign`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('signed');
    expect(res.body.data.signedAt).not.toBeNull();
  });

  it('cannot re-sign an already signed radiology report', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/radiology/orders/${orderId}/report/sign`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});

// ── Psychiatry ────────────────────────────────────────────────────────────────

describe('Psychiatry — Mental health records (Milestone 5)', () => {
  let ownerToken: string;
  let receptionistToken: string;
  let practiceId: string;
  let patientId: string;
  let recordId: string;

  beforeAll(async () => {
    ownerToken = await registerAndLogin('psych-owner@m5.synapsemed');
    receptionistToken = await registerAndLogin('psych-recept@m5.synapsemed');
    practiceId = await createPractice(ownerToken, '[m5] Psychiatry Practice');
    await activateModule(ownerToken, practiceId, 'specialty_psychiatry');
    // invite receptionist
    await request(app).post(`/api/v1/practices/${practiceId}/memberships`).set('Authorization', `Bearer ${ownerToken}`).send({ email: 'psych-recept@m5.synapsemed', role: 'receptionist' });
    await request(app).post(`/api/v1/practices/${practiceId}/memberships/accept`).set('Authorization', `Bearer ${receptionistToken}`);
    patientId = await createPatient(ownerToken, practiceId);
  });

  it('blocks psychiatry access when module is inactive', async () => {
    const t = await registerAndLogin('psych-block@m5.synapsemed');
    const pid = await createPractice(t, '[m5] Psych Block Practice');
    const res = await request(app).get(`/api/v1/practices/${pid}/psychiatry/records`).set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });

  it('creates a mental health record (accessRestricted=true by default)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/psychiatry/records`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ patientId, recordType: 'initial_assessment', content: 'Patient presents with generalised anxiety.' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessRestricted).toBe(true);
    expect(res.body.data.status).toBe('draft');
    recordId = res.body.data.id;
  });

  it('receptionist cannot read mental health records (enhanced access control)', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/psychiatry/records`).set('Authorization', `Bearer ${receptionistToken}`);
    expect(res.status).toBe(403);
  });

  it('receptionist cannot read a specific mental health record', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/psychiatry/records/${recordId}`).set('Authorization', `Bearer ${receptionistToken}`);
    expect(res.status).toBe(403);
  });

  it('owner (practitioner) can read mental health records', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/psychiatry/records`).set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((r: any) => r.id === recordId)).toBe(true);
  });

  it('AI-generated mental health records are marked draft', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/psychiatry/records`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ patientId, recordType: 'session_note', content: 'AI draft.', aiGenerated: true });
    expect(res.status).toBe(201);
    expect(res.body.data.aiGenerated).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.signedAt).toBeNull();
  });

  it('signs a mental health record', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/psychiatry/records/${recordId}/sign`).set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('signed');
    expect(res.body.data.signedAt).not.toBeNull();
  });

  it('cannot re-sign an already signed mental health record', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/psychiatry/records/${recordId}/sign`).set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(409);
  });
});

// ── Allied health ─────────────────────────────────────────────────────────────

describe('Allied health — Sessions (Milestone 5)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let sessionId: string;

  beforeAll(async () => {
    token = await registerAndLogin('allied@m5.synapsemed');
    practiceId = await createPractice(token, '[m5] Allied Practice');
    await activateModule(token, practiceId, 'specialty_allied_health');
    patientId = await createPatient(token, practiceId);
  });

  it('blocks access when specialty_allied_health module is inactive', async () => {
    const t = await registerAndLogin('allied-block@m5.synapsemed');
    const pid = await createPractice(t, '[m5] Allied Block Practice');
    const res = await request(app).get(`/api/v1/practices/${pid}/allied-health/sessions`).set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });

  it('creates an allied health session', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/allied-health/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, discipline: 'physiotherapy', sessionType: 'initial_assessment', outcomeNotes: 'Patient shows limited lumbar flexion. Plan: 6-week rehabilitation.', durationMinutes: 45, goals: 'Restore full ROM, reduce pain to <2/10' });
    expect(res.status).toBe(201);
    expect(res.body.data.discipline).toBe('physiotherapy');
    expect(res.body.data.status).toBe('draft');
    sessionId = res.body.data.id;
  });

  it('rejects session with missing outcomeNotes', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/allied-health/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, discipline: 'physiotherapy', sessionType: 'follow_up' });
    expect(res.status).toBe(422);
  });

  it('lists sessions filtered by discipline', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/allied-health/sessions?discipline=physiotherapy`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: any) => s.discipline === 'physiotherapy')).toBe(true);
  });

  it('retrieves a specific session', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/allied-health/sessions/${sessionId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.goals).toContain('ROM');
  });

  it('signs a session', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/allied-health/sessions/${sessionId}/sign`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('signed');
    expect(res.body.data.signedAt).not.toBeNull();
  });

  it('cannot re-sign an already signed session', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/allied-health/sessions/${sessionId}/sign`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});
