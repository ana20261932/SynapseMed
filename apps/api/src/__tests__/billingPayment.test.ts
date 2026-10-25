import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

async function registerAndLogin(email: string) {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'BillPay!Pass1', firstName: 'Bill', lastName: 'Pay' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'BillPay!Pass1' });
  return res.body.data.accessToken as string;
}

async function createPractice(token: string, name: string) {
  const res = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name, organisationType: 'group_practice' });
  return res.body.data as { id: string };
}

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[bill]' } } });
  const pids = practices.map(p => p.id);
  await prisma.paymentEvent.deleteMany({ where: { practiceId: { in: pids } } });
  await prisma.paymentMethodToken.deleteMany({ where: { practiceId: { in: pids } } });
  await prisma.subscription.deleteMany({ where: { practiceId: { in: pids } } });
  await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
  for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
  for (const pid of pids) await prisma.organisation.deleteMany({ where: { practices: { some: { id: pid } } } });
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@bill.synapsemed' } } });
  await prisma.$disconnect();
});

describe('Plans and subscriptions (Milestone 2)', () => {
  let token: string, practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('owner@bill.synapsemed');
    const p = await createPractice(token, '[bill] Practice');
    practiceId = p.id;
  });

  it('lists plans via practice-scoped endpoint', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/subscriptions/plans`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((p: any) => p.name === 'Free')).toBe(true);
  });

  it('allows free plan without card', async () => {
    const plans = await request(app).get(`/api/v1/practices/${practiceId}/subscriptions/plans`).set('Authorization', `Bearer ${token}`);
    const free = plans.body.data.find((p: any) => p.name === 'Free');
    const res = await request(app).post(`/api/v1/practices/${practiceId}/subscriptions`).set('Authorization', `Bearer ${token}`).send({ planId: free.id });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
  });

  it('requires payment method for paid plans', async () => {
    const plans = await request(app).get(`/api/v1/practices/${practiceId}/subscriptions/plans`).set('Authorization', `Bearer ${token}`);
    const paid = plans.body.data.find((p: any) => p.priceZar > 0);
    const res = await request(app).post(`/api/v1/practices/${practiceId}/subscriptions`).set('Authorization', `Bearer ${token}`).send({ planId: paid.id });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PAYMENT_REQUIRED');
  });

  it('tokenizes payment method (no raw card stored)', async () => {
    const res = await request(app).post(`/api/v1/practices/${practiceId}/payments/methods/tokenize`).set('Authorization', `Bearer ${token}`).send({ providerName: 'mock', last4: '4242', brand: 'visa', expiryMonth: 12, expiryYear: 2028 });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toMatch(/^tok_/);
  });

  it('handles webhook idempotently', async () => {
    const payload = { providerEventId: 'evt_test_123', eventType: 'payment.succeeded', practiceId, amountZar: 499, status: 'succeeded' };
    const res1 = await request(app).post('/api/v1/practices/whatever/payments/webhooks/mock').send(payload);
    expect([200,201]).toContain(res1.status);
    const res2 = await request(app).post('/api/v1/practices/whatever/payments/webhooks/mock').send(payload);
    expect(res2.body.data?._idempotent || res2.body.idempotent).toBeTruthy();
  });
});
