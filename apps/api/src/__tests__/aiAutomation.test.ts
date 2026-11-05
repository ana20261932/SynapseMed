/**
 * Milestone 6 — AI Automation Centre
 *
 * Covers:
 *  - Provider-independent job dispatch with mock provider
 *  - All output starts as requires_review — never auto-applied
 *  - Autonomous clinical action attempts are blocked (403)
 *  - Usage limits enforced per practice per period per purpose
 *  - Review workflow: approve / reject
 *  - Redaction / minimisation of output
 *  - Transcription: consent gate, draft transcript, audio deletion
 *  - Module guard (ai_admin) blocks access when inactive
 */
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'M6Test!Pass99', firstName: 'AI', lastName: 'Test' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'M6Test!Pass99' });
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
  const res = await request(app).post(`/api/v1/practices/${practiceId}/patients`).set('Authorization', `Bearer ${token}`).send({ firstName: 'AI', lastName: 'Patient' });
  return res.body.data.id as string;
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[m6]' } } });
  const pids = practices.map((p) => p.id);
  if (pids.length) {
    await prisma.transcriptionJob.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.aiUsageLedger.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.aiJob.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.patient.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.moduleEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
    for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
    await prisma.organisation.deleteMany({ where: { name: { startsWith: '[m6]' } } });
  }
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@m6.synapsemed' } } });
  await prisma.$disconnect();
});

// ── Module guard ──────────────────────────────────────────────────────────────

describe('AI module guard (Milestone 6)', () => {
  it('blocks AI job dispatch when ai_admin module is inactive', async () => {
    const token = await registerAndLogin('ai-block@m6.synapsemed');
    const pid = await createPractice(token, '[m6] AI Block Practice');
    // module not activated
    const res = await request(app)
      .post(`/api/v1/practices/${pid}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'admin_classification' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });
});

// ── Job dispatch and review ───────────────────────────────────────────────────

describe('AI job dispatch and review (Milestone 6)', () => {
  let token: string;
  let practiceId: string;
  let jobId: string;

  beforeAll(async () => {
    token = await registerAndLogin('ai-owner@m6.synapsemed');
    practiceId = await createPractice(token, '[m6] AI Practice');
    await activateModule(token, practiceId, 'ai_admin');
  });

  it('dispatches an admin classification job', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'admin_classification', inputRef: 'doc-ref-001' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('requires_review');
    expect(res.body.data.reviewRequired).toBe(true);
    expect(res.body.data._warning).toContain('DRAFT');
    jobId = res.body.data.id;
  });

  it('dispatches a draft_note job', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'draft_note' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('requires_review');
  });

  it('dispatches an inventory_forecast job', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'inventory_forecast' });
    expect(res.status).toBe(201);
    expect(res.body.data.reviewRequired).toBe(true);
  });

  it('blocks autonomous_diagnosis attempt', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'autonomous_diagnosis' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTONOMOUS_CLINICAL_ACTION_BLOCKED');
  });

  it('blocks autonomous_prescription attempt', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'autonomous_prescription' });
    expect(res.status).toBe(403);
  });

  it('blocks autonomous_claim attempt', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'autonomous_claim' });
    expect(res.status).toBe(403);
  });

  it('lists AI jobs', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/ai/jobs`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((j: any) => j.id === jobId)).toBe(true);
  });

  it('retrieves a specific AI job', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/ai/jobs/${jobId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.purpose).toBe('admin_classification');
  });

  it('approves an AI job output', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs/${jobId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.reviewedAt).not.toBeNull();
  });

  it('cannot review an already-reviewed job', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs/${jobId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'approved' });
    expect(res.status).toBe(409);
  });

  it('rejects an AI job output', async () => {
    const newJob = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'reminder_suggestion' });
    const rejRes = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs/${newJob.body.data.id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'rejected' });
    expect(rejRes.status).toBe(200);
    expect(rejRes.body.data.status).toBe('failed');
  });
});

// ── Redaction / minimisation ──────────────────────────────────────────────────

describe('AI output redaction (Milestone 6)', () => {
  let token: string;
  let practiceId: string;
  let jobId: string;

  beforeAll(async () => {
    token = await registerAndLogin('ai-redact@m6.synapsemed');
    practiceId = await createPractice(token, '[m6] Redact Practice');
    await activateModule(token, practiceId, 'ai_admin');
    const job = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'draft_summary' });
    jobId = job.body.data.id;
  });

  it('redacts an AI job output', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs/${jobId}/redact`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.outputRef).toBe('[REDACTED]');
    expect(res.body.data.redactedAt).not.toBeNull();
    expect(res.body.data.status).toBe('failed');
  });

  it('cannot redact an already-redacted job', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs/${jobId}/redact`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});

// ── Usage limits ──────────────────────────────────────────────────────────────

describe('AI usage limits (Milestone 6)', () => {
  let token: string;
  let practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('ai-limit@m6.synapsemed');
    practiceId = await createPractice(token, '[m6] Limit Practice');
    await activateModule(token, practiceId, 'ai_admin');
  });

  it('returns usage summary for current period', async () => {
    await request(app).post(`/api/v1/practices/${practiceId}/ai/jobs`).set('Authorization', `Bearer ${token}`).send({ purpose: 'inventory_forecast' });
    const res = await request(app).get(`/api/v1/practices/${practiceId}/ai/usage`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.usage).toBeDefined();
    const entry = res.body.data.usage.find((u: any) => u.purpose === 'inventory_forecast');
    expect(entry).toBeDefined();
    expect(entry.used).toBeGreaterThanOrEqual(1);
    expect(entry.limit).toBe(20);
  });

  it('enforces monthly limit — returns 429 when limit is reached', async () => {
    // Set ledger to the limit directly
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    await prisma.aiUsageLedger.upsert({
      where: { practiceId_periodStart_purpose: { practiceId, periodStart, purpose: 'reminder_suggestion' } },
      create: { practiceId, periodStart, periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0), purpose: 'reminder_suggestion', jobCount: 100 },
      update: { jobCount: 100 },
    });
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'reminder_suggestion' });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('AI_LIMIT_EXCEEDED');
  });
});

// ── Transcription pipeline ────────────────────────────────────────────────────

describe('Transcription — consent gate and lifecycle (Milestone 6)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;
  let transcriptionJobId: string;

  beforeAll(async () => {
    token = await registerAndLogin('transcribe@m6.synapsemed');
    practiceId = await createPractice(token, '[m6] Transcription Practice');
    await activateModule(token, practiceId, 'ai_admin');
    patientId = await createPatient(token, practiceId);
  });

  it('creates a transcription job in pending_consent state', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/transcription`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, audioRef: 'audio-store/session-001.enc', retainAudioDays: 30 });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending_consent');
    expect(res.body.data.consentGranted).toBe(false);
    expect(res.body.data._warning).toContain('consent');
    transcriptionJobId = res.body.data.id;
  });

  it('rejects transcription job creation with invalid patientId', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/transcription`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: 'non-existent', audioRef: 'ref' });
    expect(res.status).toBe(404);
  });

  it('grants consent and receives draft transcript', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/transcription/${transcriptionJobId}/consent-grant`)
      .set('Authorization', `Bearer ${token}`)
      .send({ consentRef: 'consent-form-signed-2026-10-25' });
    expect(res.status).toBe(200);
    expect(res.body.data.consentGranted).toBe(true);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.transcriptDraft).toContain('[MOCK TRANSCRIPT]');
    expect(res.body.data._warning).toContain('DRAFT');
  });

  it('cannot grant consent twice for the same job', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/transcription/${transcriptionJobId}/consent-grant`)
      .set('Authorization', `Bearer ${token}`)
      .send({ consentRef: 'duplicate-consent' });
    expect(res.status).toBe(409);
  });

  it('deletes audio for retention compliance', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/transcription/${transcriptionJobId}/delete-audio`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.audioRef).toBe('[DELETED]');
    expect(res.body.data.audioDeletedAt).not.toBeNull();
  });

  it('cannot delete audio twice', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/ai/transcription/${transcriptionJobId}/delete-audio`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});
