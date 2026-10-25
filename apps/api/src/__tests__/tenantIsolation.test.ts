import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

async function registerAndLogin(email: string) {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'IsolatioN!Pass1', firstName: 'Iso', lastName: 'Test' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'IsolatioN!Pass1' });
  return res.body.data.accessToken as string;
}

async function createPractice(token: string, name: string) {
  const res = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name, organisationType: 'group_practice' });
  return res.body.data as { id: string };
}

afterAll(async () => {
  await prisma.moduleEntitlement.deleteMany({ where: { practice: { name: { startsWith: '[iso]' } } } });
  await prisma.practiceMembership.deleteMany({ where: { practice: { name: { startsWith: '[iso]' } } } });
  await prisma.practice.deleteMany({ where: { name: { startsWith: '[iso]' } } });
  await prisma.organisation.deleteMany({ where: { name: { startsWith: '[iso]' } } });
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@iso.synapsemed' } } });
  await prisma.$disconnect();
});

describe('Tenant isolation', () => {
  let tokenA: string, tokenB: string, practiceAId: string;

  beforeAll(async () => {
    tokenA = await registerAndLogin('usera@iso.synapsemed');
    tokenB = await registerAndLogin('userb@iso.synapsemed');
    const p = await createPractice(tokenA, '[iso] Practice A');
    practiceAId = p.id;
  });

  it('owner can read their own practice', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceAId}`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(practiceAId);
  });

  it('user B (non-member) is forbidden', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceAId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('user B cannot list patients in practice A', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceAId}/patients`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('unauthenticated request is rejected with 401', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceAId}/patients`);
    expect(res.status).toBe(401);
  });
});

describe('Module entitlement enforcement', () => {
  let token: string, practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('ent@iso.synapsemed');
    const p = await createPractice(token, '[iso] Entitlement Practice');
    practiceId = p.id;
    await prisma.moduleEntitlement.updateMany({ where: { practiceId }, data: { status: 'inactive' } });
  });

  it('returns 403 MODULE_DISABLED when scheduling inactive', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/appointments`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MODULE_DISABLED');
  });

  it('allows access after activating module', async () => {
    await request(app).put(`/api/v1/practices/${practiceId}/modules/scheduling`).set('Authorization', `Bearer ${token}`).send({ status: 'active' });
    const res = await request(app).get(`/api/v1/practices/${practiceId}/appointments`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('RBAC — role enforcement', () => {
  let ownerToken: string, receptionistToken: string, practiceId: string;

  beforeAll(async () => {
    ownerToken = await registerAndLogin('owner-rbac@iso.synapsemed');
    receptionistToken = await registerAndLogin('recept-rbac@iso.synapsemed');
    const p = await createPractice(ownerToken, '[iso] RBAC Practice');
    practiceId = p.id;
    await request(app).post(`/api/v1/practices/${practiceId}/memberships`).set('Authorization', `Bearer ${ownerToken}`).send({ email: 'recept-rbac@iso.synapsemed', role: 'receptionist' });
    await request(app).post(`/api/v1/practices/${practiceId}/memberships/accept`).set('Authorization', `Bearer ${receptionistToken}`);
  });

  it('receptionist cannot update practice settings', async () => {
    const res = await request(app).patch(`/api/v1/practices/${practiceId}`).set('Authorization', `Bearer ${receptionistToken}`).send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('owner can update practice settings', async () => {
    const res = await request(app).patch(`/api/v1/practices/${practiceId}`).set('Authorization', `Bearer ${ownerToken}`).send({ phone: '+27110000099' });
    expect(res.status).toBe(200);
  });
});

describe('Billing separation', () => {
  it('PmsInvoice and SwitchUsageEvent are distinct Prisma models', () => {
    expect(prisma.pmsInvoice).toBeDefined();
    expect(prisma.switchUsageEvent).toBeDefined();
    expect(prisma.pmsInvoice).not.toBe(prisma.switchUsageEvent);
  });
});

describe('Switch mock safety', () => {
  let token: string, practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('switch-test@iso.synapsemed');
    const p = await createPractice(token, '[iso] Switch Practice');
    practiceId = p.id;
    await request(app).put(`/api/v1/practices/${practiceId}/modules/switch`).set('Authorization', `Bearer ${token}`).send({ status: 'active' });
    await prisma.switchProviderConnection.upsert({ where: { practiceId }, create: { practiceId, providerName: 'MockSwitch', environment: 'mock', connectionStatus: 'active', contractApproved: false }, update: {} });
  });

  it('mock switch event is labelled simulated', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/switch/events`).set('Authorization', `Bearer ${token}`).send({ eventType: 'claim_submission', payload: { claimId: 'demo-001' } });
    expect(res.status).toBe(201);
    expect(res.body.data.isMock).toBe(true);
    expect(res.body.data.status).toBe('simulated');
    expect(res.body.data._warning).toContain('SIMULATED');
  });
});
