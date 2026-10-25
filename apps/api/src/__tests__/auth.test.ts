import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

beforeAll(async () => { await prisma.$connect(); });

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.synapsemed' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('rejects short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'a@test.synapsemed', password: 'short', firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('registers successfully', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'reg@test.synapsemed', password: 'StrongPass!123', firstName: 'Test', lastName: 'User' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'reg@test.synapsemed', password: 'StrongPass!123', firstName: 'Test', lastName: 'User' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'reg@test.synapsemed', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  it('returns tokens on valid login', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'reg@test.synapsemed', password: 'StrongPass!123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user with valid token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'reg@test.synapsemed', password: 'StrongPass!123' });
    const token = login.body.data.accessToken;
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('reg@test.synapsemed');
  });
});
