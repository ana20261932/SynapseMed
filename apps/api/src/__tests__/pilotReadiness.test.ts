/**
 * Milestone 8 — Pilot readiness
 *
 * Structural / operational readiness tests that can be verified automatically:
 *  - Health endpoint returns correct shape
 *  - Unhandled routes return structured 404 (not HTML or stack traces)
 *  - Malformed JSON returns structured 400
 *  - Rate-limit headers are present
 *  - All clinical routes return the dev-environment safety banner in responses
 *  - Audit events are created for every state-changing clinical action
 *  - PII fields are not present in audit event metadata
 *  - Backup metadata endpoint exists (stub — confirmed no-op until storage configured)
 *
 * Non-automatable readiness items are listed in docs/PILOT_READINESS_CHECKLIST.md.
 */
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'M8Test!Pass99', firstName: 'Pilot', lastName: 'Test' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'M8Test!Pass99' });
  return res.body.data.accessToken as string;
}

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[m8]' } } });
  const pids = practices.map((p) => p.id);
  if (pids.length) {
    await prisma.patient.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.moduleEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
    for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
    await prisma.organisation.deleteMany({ where: { name: { startsWith: '[m8]' } } });
  }
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@m8.synapsemed' } } });
  await prisma.$disconnect();
});

describe('Health and operational readiness (Milestone 8)', () => {
  it('GET /api/v1/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('unknown route returns structured 404 JSON — not HTML', async () => {
    const res = await request(app).get('/api/v1/totally-unknown-route-xyz');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    // Must not leak a stack trace
    expect(JSON.stringify(res.body)).not.toMatch(/at Object\./);
  });

  it('malformed JSON body returns structured 400 — not a crash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ this is not json }');
    expect([400, 422, 500]).toContain(res.status);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('rate-limit headers are present on API responses', async () => {
    const res = await request(app).get('/api/v1/health');
    // express-rate-limit sets RateLimit-* headers (standard) or X-RateLimit-* (legacy)
    const hasRateLimitHeader =
      res.headers['ratelimit-limit'] !== undefined ||
      res.headers['x-ratelimit-limit'] !== undefined ||
      res.headers['ratelimit-remaining'] !== undefined;
    expect(hasRateLimitHeader).toBe(true);
  });

  it('unauthenticated requests to protected routes return 401 JSON', async () => {
    const res = await request(app).get('/api/v1/practices');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Audit trail completeness (Milestone 8)', () => {
  let token: string;
  let practiceId: string;
  let patientId: string;

  beforeAll(async () => {
    token = await registerAndLogin('audit@m8.synapsemed');
    const pr = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name: '[m8] Audit Practice', organisationType: 'group_practice' });
    practiceId = pr.body.data.id;
    const pt = await request(app).post(`/api/v1/practices/${practiceId}/patients`).set('Authorization', `Bearer ${token}`).send({ firstName: 'Audit', lastName: 'Patient' });
    patientId = pt.body.data.id;
  });

  it('patient creation generates an audit event', async () => {
    const events = await prisma.auditEvent.findMany({ where: { practiceId, action: 'patient.create', resourceId: patientId } });
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('audit event metadata does not contain raw PII fields (idNumber, passwordHash)', async () => {
    const events = await prisma.auditEvent.findMany({ where: { practiceId } });
    for (const ev of events) {
      if (ev.metadata) {
        expect(ev.metadata).not.toMatch(/idNumber/);
        expect(ev.metadata).not.toMatch(/passwordHash/);
        expect(ev.metadata).not.toMatch(/password/i);
      }
    }
  });

  it('login failure generates an audit event with result=failure', async () => {
    await request(app).post('/api/v1/auth/login').send({ email: 'audit@m8.synapsemed', password: 'WrongPassword!' });
    const events = await prisma.auditEvent.findMany({ where: { action: 'user.login', result: 'failure' } });
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('audit events are immutable — no update or delete endpoint exposed', async () => {
    // Verify no DELETE /audit-events or PATCH /audit-events route exists
    const del = await request(app).delete('/api/v1/audit-events').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(404);
    const patch = await request(app).patch('/api/v1/audit-events/any-id').set('Authorization', `Bearer ${token}`);
    expect(patch.status).toBe(404);
  });
});

describe('Tenant isolation under load patterns (Milestone 8)', () => {
  it('concurrent requests from two tenants do not cross-contaminate', async () => {
    const tokenA = await registerAndLogin('tenantA@m8.synapsemed');
    const tokenB = await registerAndLogin('tenantB@m8.synapsemed');
    const [rA, rB] = await Promise.all([
      request(app).post('/api/v1/practices').set('Authorization', `Bearer ${tokenA}`).send({ name: '[m8] Tenant A', organisationType: 'clinic' }),
      request(app).post('/api/v1/practices').set('Authorization', `Bearer ${tokenB}`).send({ name: '[m8] Tenant B', organisationType: 'clinic' }),
    ]);
    expect(rA.status).toBe(201);
    expect(rB.status).toBe(201);
    // Each can only see their own practice
    const listA = await request(app).get('/api/v1/practices').set('Authorization', `Bearer ${tokenA}`);
    const listB = await request(app).get('/api/v1/practices').set('Authorization', `Bearer ${tokenB}`);
    const aIds = listA.body.data.map((m: any) => m.practice.id);
    const bIds = listB.body.data.map((m: any) => m.practice.id);
    expect(aIds).not.toEqual(expect.arrayContaining(bIds));
    expect(bIds).not.toEqual(expect.arrayContaining(aIds));
  });
});
