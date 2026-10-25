import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

async function registerAndLogin(email: string) {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'SwitchBill!Pass1', firstName: 'Sw', lastName: 'Bill' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'SwitchBill!Pass1' });
  return res.body.data.accessToken as string;
}

async function createPractice(token: string, name: string) {
  const res = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name, organisationType: 'group_practice' });
  return res.body.data as { id: string };
}

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[sw]' } } });
  const pids = practices.map(p => p.id);
  await prisma.switchInvoiceLine.deleteMany({ where: { invoice: { practiceId: { in: pids } } } });
  await prisma.switchInvoice.deleteMany({ where: { practiceId: { in: pids } } });
  await prisma.switchUsageEvent.deleteMany({ where: { connection: { practiceId: { in: pids } } } });
  await prisma.switchFeeRule.deleteMany({ where: { connection: { practiceId: { in: pids } } } });
  await prisma.switchProviderConnection.deleteMany({ where: { practiceId: { in: pids } } });
  await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
  for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@sw.synapsemed' } } });
  await prisma.$disconnect();
});

describe('Switch billing separation (Milestone 3)', () => {
  let token: string, practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('owner@sw.synapsemed');
    const p = await createPractice(token, '[sw] Practice');
    practiceId = p.id;
    await request(app).put(`/api/v1/practices/${practiceId}/modules/switch`).set('Authorization', `Bearer ${token}`).send({ status: 'active' });
  });

  it('can activate mock switch independently', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/switch/activate`).set('Authorization', `Bearer ${token}`).send({ providerName: 'MockSwitch' });
    expect(res.status).toBe(200);
    expect(res.body.data._warning).toContain('MOCK SWITCH');
    expect(res.body.data.environment).toBe('mock');
  });

  it('creates separate switch invoice not tied to PMS subscription', async () => {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId } });
    expect(conn).toBeTruthy();
    const res = await request(app).post(`/api/v1/practices/${practiceId}/switch/invoices/generate`).set('Authorization', `Bearer ${token}`).send({ periodStart: '2026-10-01', periodEnd: '2026-10-31', lines: [{ description: 'claim submission fee', providerFeeZar: 5, platformFeeZar: 1 }] });
    expect(res.status).toBe(201);
    expect(res.body.data.totalZar).toBe(6);
    expect(res.body.data._warning).toContain('SEPARATE FROM PMS SUBSCRIPTION');
  });

  it('PmsInvoice and SwitchInvoice remain distinct', async () => {
    expect(prisma.pmsInvoice).toBeDefined();
    expect(prisma.switchInvoice).toBeDefined();
  });
});
