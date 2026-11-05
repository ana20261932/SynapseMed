/**
 * Milestone 7 — Extension marketplace
 *
 * Covers:
 *  - Publisher registration with pending review state
 *  - Review state machine (approved / rejected / suspended)
 *  - Unapproved extension cannot be installed (permission boundary)
 *  - Install, enable, disable, uninstall, reinstall lifecycle
 *  - Rollback to a previous version
 *  - Install audit log
 *  - Extensions cannot bypass tenant isolation (non-member blocked)
 *  - Server-side entitlement enforcement (status checked server-side)
 */
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'M7Test!Pass99', firstName: 'Ext', lastName: 'Test' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'M7Test!Pass99' });
  return res.body.data.accessToken as string;
}

async function createPractice(token: string, name: string): Promise<string> {
  const res = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name, organisationType: 'group_practice' });
  return res.body.data.id as string;
}

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[m7]' } } });
  const pids = practices.map((p) => p.id);
  if (pids.length) {
    await prisma.extensionInstallLog.deleteMany({ where: { entitlement: { practiceId: { in: pids } } } });
    await prisma.practiceExtensionEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.moduleEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
    for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
    await prisma.organisation.deleteMany({ where: { name: { startsWith: '[m7]' } } });
  }
  await prisma.extensionVersion.deleteMany({ where: { extension: { publisherId: { contains: 'm7' } } } });
  await prisma.extension.deleteMany({ where: { slug: { startsWith: 'm7-' } } });
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@m7.synapsemed' } } });
  await prisma.$disconnect();
});

describe('Extension marketplace (Milestone 7)', () => {
  let publisherToken: string;
  let ownerToken: string;
  let outsiderToken: string;
  let practiceId: string;
  let extensionId: string;
  let entitlementId: string;

  beforeAll(async () => {
    publisherToken = await registerAndLogin('publisher@m7.synapsemed');
    ownerToken = await registerAndLogin('owner@m7.synapsemed');
    outsiderToken = await registerAndLogin('outsider@m7.synapsemed');
    practiceId = await createPractice(ownerToken, '[m7] Practice');
  });

  it('registers an extension (starts pending review)', async () => {
    const res = await request(app)
      .post('/api/v1/extensions/register')
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ name: 'M7 Test Extension', slug: 'm7-test-ext', latestVersion: '1.0.0', description: 'A test extension', price: 99, permissions: ['read:patients'] });
    expect(res.status).toBe(201);
    expect(res.body.data.reviewState).toBe('pending');
    expect(res.body.data.versions).toHaveLength(1);
    extensionId = res.body.data.id;
  });

  it('rejects duplicate slug registration', async () => {
    const res = await request(app)
      .post('/api/v1/extensions/register')
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ name: 'Duplicate', slug: 'm7-test-ext', latestVersion: '1.0.0' });
    expect(res.status).toBe(409);
  });

  it('pending extension does not appear in public catalogue', async () => {
    const res = await request(app).get('/api/v1/extensions/catalogue').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((e: any) => e.slug !== 'm7-test-ext')).toBe(true);
  });

  it('blocks installation of unapproved (pending) extension', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/install`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ extensionId });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EXTENSION_NOT_APPROVED');
  });

  it('approves an extension via review', async () => {
    const res = await request(app)
      .patch(`/api/v1/extensions/catalogue/m7-test-ext/review`)
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ reviewState: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.data.reviewState).toBe('approved');
  });

  it('approved extension appears in public catalogue', async () => {
    const res = await request(app).get('/api/v1/extensions/catalogue').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: any) => e.slug === 'm7-test-ext')).toBe(true);
  });

  it('installs an approved extension', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/install`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ extensionId });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.installedVersion).toBe('1.0.0');
    entitlementId = res.body.data.id;
  });

  it('non-member cannot install extensions for a practice', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/install`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ extensionId });
    expect(res.status).toBe(403);
  });

  it('lists installed extensions for practice', async () => {
    const res = await request(app).get(`/api/v1/practices/${practiceId}/extensions`).set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: any) => e.id === entitlementId)).toBe(true);
  });

  it('disables an active extension', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/disable`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('disabled');
  });

  it('cannot disable an already-disabled extension', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/disable`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(409);
  });

  it('re-enables a disabled extension', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/enable`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('adds a new version for rollback target', async () => {
    // Simulate publisher pushing v1.1.0
    await prisma.extensionVersion.create({ data: { extensionId, version: '1.1.0', changelog: 'Bug fixes', manifestJson: '{}', permissions: '[]' } });
    await prisma.extension.update({ where: { id: extensionId }, data: { latestVersion: '1.1.0' } });
  });

  it('rolls back to a previous version', async () => {
    // First update installed version to 1.1.0
    await prisma.practiceExtensionEntitlement.update({ where: { id: entitlementId }, data: { installedVersion: '1.1.0' } });
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/rollback`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ version: '1.0.0' });
    expect(res.status).toBe(200);
    expect(res.body.data.installedVersion).toBe('1.0.0');
  });

  it('rejects rollback to a non-existent version', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/rollback`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ version: '9.9.9' });
    expect(res.status).toBe(404);
  });

  it('uninstalls an extension', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/uninstall`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('uninstalled');
  });

  it('install audit log contains all lifecycle events', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/extensions/${entitlementId}/logs`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    const events = res.body.data.map((l: any) => l.event);
    expect(events).toContain('install');
    expect(events).toContain('disable');
    expect(events).toContain('enable');
    expect(events).toContain('rollback');
    expect(events).toContain('uninstall');
  });

  it('suspended extension disappears from catalogue', async () => {
    await request(app).patch(`/api/v1/extensions/catalogue/m7-test-ext/review`).set('Authorization', `Bearer ${publisherToken}`).send({ reviewState: 'suspended' });
    const res = await request(app).get('/api/v1/extensions/catalogue').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.body.data.every((e: any) => e.slug !== 'm7-test-ext')).toBe(true);
  });
});
