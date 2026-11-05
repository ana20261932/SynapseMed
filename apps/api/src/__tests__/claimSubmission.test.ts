/**
 * Realistic SA claim submission tests
 *
 * Demonstrates the full claim lifecycle as a doctor would use it:
 *  - Reference data (schemes, ICD-10, NAPPI, tariffs, RA codes)
 *  - Claim 1: Consultation + hypertension drug — PMB condition, 100% benefit
 *  - Claim 2: GP consultation with flu diagnosis — partial pay (copayment)
 *  - Validation errors: invalid ICD-10, bad BHF number, expired submission window
 *  - Reversal of an accepted/partial claim
 *  - Claim status retrieval
 *  - Adjudication response contains RA codes and patient-liable amount
 *  - All responses labelled _isMock=true and carry _warning
 */
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'ClaimT!Pass99', firstName: 'Claim', lastName: 'Doc' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'ClaimT!Pass99' });
  return res.body.data.accessToken as string;
}

afterAll(async () => {
  const practices = await prisma.practice.findMany({ where: { name: { startsWith: '[claim]' } } });
  const pids = practices.map((p) => p.id);
  if (pids.length) {
    await prisma.switchUsageEvent.deleteMany({ where: { connection: { practiceId: { in: pids } } } });
    await prisma.switchInvoiceLine.deleteMany({ where: { invoice: { practiceId: { in: pids } } } });
    await prisma.switchInvoice.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.switchFeeRule.deleteMany({ where: { connection: { practiceId: { in: pids } } } });
    await prisma.switchProviderConnection.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.moduleEntitlement.deleteMany({ where: { practiceId: { in: pids } } });
    await prisma.practiceMembership.deleteMany({ where: { practiceId: { in: pids } } });
    for (const pid of pids) await prisma.practice.delete({ where: { id: pid } });
    await prisma.organisation.deleteMany({ where: { name: { startsWith: '[claim]' } } });
  }
  await prisma.auditEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@claim.synapsemed' } } });
  await prisma.$disconnect();
});

describe('SA Switch reference data', () => {
  let token: string;
  beforeAll(async () => { token = await registerAndLogin('ref@claim.synapsemed'); });

  it('returns SA medical aid schemes', async () => {
    const res = await request(app).get('/api/v1/practices/any/switch/reference/schemes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.DISC.name).toBe('Discovery Health Medical Scheme');
    expect(res.body.data.GEMS).toBeDefined();
  });

  it('returns SAMA/NHRPL tariff codes', async () => {
    const res = await request(app).get('/api/v1/practices/any/switch/reference/tariffs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data['0191'].description).toContain('established patient');
  });

  it('returns NAPPI codes', async () => {
    const res = await request(app).get('/api/v1/practices/any/switch/reference/nappi').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data['717461001'].name).toBe('Metformin');
  });

  it('returns ICD-10 codes', async () => {
    const res = await request(app).get('/api/v1/practices/any/switch/reference/icd10').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data['I10'].description).toBe('Essential (primary) hypertension');
    expect(res.body.data['E11.9'].category).toBe('Endocrine');
  });

  it('returns RA reason codes', async () => {
    const res = await request(app).get('/api/v1/practices/any/switch/reference/ra-codes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data['RA009'].description).toContain('Co-payment');
    expect(res.body.data['RA017'].category).toBe('info');
  });
});

describe('SA claim submission — realistic doctor workflow', () => {
  let token: string;
  let practiceId: string;
  let acceptedEventId: string;
  let partialEventId: string;

  beforeAll(async () => {
    token = await registerAndLogin('doctor@claim.synapsemed');
    const pr = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name: '[claim] Dr Practice', organisationType: 'group_practice' });
    practiceId = pr.body.data.id;
    await request(app).put(`/api/v1/practices/${practiceId}/modules/switch`).set('Authorization', `Bearer ${token}`).send({ status: 'active' });
    await request(app).post(`/api/v1/practices/${practiceId}/switch/activate`).set('Authorization', `Bearer ${token}`).send({ providerName: 'MockSwitch', bhfPracticeNumber: '1234567' });
  });

  it('Claim 1 — Hypertension (PMB): consultation + antihypertensive → accepted at 100%', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bhfPracticeNumber: '1234567',
        treatingPractitionerHpcsa: 'MP0123456',
        schemeCode: 'DISC',
        planCode: 'Classic',
        membershipNumber: 'DISC1234567',
        dependantCode: '00',
        serviceDate: new Date().toISOString().split('T')[0],
        principalDiagnosis: 'I10',           // Essential hypertension — PMB
        lines: [
          {
            code: '0191',
            codeType: 'tariff',
            description: 'GP consultation — established patient',
            quantity: 1,
            unitPriceZar: 650,
            diagnosisCodes: ['I10'],
          },
          {
            code: '717463001',                // Amlodipine — NAPPI
            codeType: 'nappi',
            description: 'Amlodipine 5mg x30',
            quantity: 1,
            unitPriceZar: 65,
            diagnosisCodes: ['I10'],
          },
        ],
      });

    expect(res.status).toBe(201);
    // PMB condition — should be accepted or partial (scheme rate applied)
    expect(['accepted', 'partial']).toContain(res.body.data.status);
    expect(res.body.data._isMock).toBe(true);
    expect(res.body.data._warning).toContain('SIMULATED');
    expect(res.body.data._environment).toBe('mock');
    expect(res.body.data.claimRaCodes.some((r: any) => r.code === 'RA017')).toBe(true); // PMB flag
    expect(res.body.data.lines).toHaveLength(2);
    expect(res.body.data.schemeRef).toMatch(/^MOCK-/);
    expect(res.body.data.adjudicatedAt).toBeDefined();
    acceptedEventId = res.body.data.eventId;
  });

  it('Claim 2 — Flu: consultation only → partial (copayment applied, RA009)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bhfPracticeNumber: '1234567',
        treatingPractitionerHpcsa: 'MP0123456',
        schemeCode: 'GEMS',
        planCode: 'Emerald',
        membershipNumber: 'GEMS9876543',
        dependantCode: '00',
        serviceDate: new Date().toISOString().split('T')[0],
        principalDiagnosis: 'J11.1',          // Influenza — non-PMB
        lines: [
          {
            code: '0191',
            codeType: 'tariff',
            description: 'GP consultation — established patient',
            quantity: 1,
            unitPriceZar: 650,
            diagnosisCodes: ['J11.1'],
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('partial');               // copayment applied
    expect(res.body.data.claimRaCodes.some((r: any) => r.code === 'RA009')).toBe(true); // copayment RA
    expect(res.body.data.totalPatientLiableZar).toBeGreaterThan(0);
    expect(res.body.data.totalApprovedZar).toBeGreaterThan(0);
    partialEventId = res.body.data.eventId;
  });

  it('retrieves claim status with full adjudication detail', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/switch/claims/${acceptedEventId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.adjudication).not.toBeNull();
    expect(res.body.data.adjudication.lines).toHaveLength(2);
    expect(res.body.data._isMock).toBe(true);
  });

  it('lists claims for the practice', async () => {
    const res = await request(app)
      .get(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.every((e: any) => e.isMock === true)).toBe(true);
  });

  it('reverses the partial claim (e.g. patient dispute)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims/${partialEventId}/reverse`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Patient disputes service — duplicate claim identified' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('reversed');
    expect(res.body.data.reversalRef).toMatch(/^REV-/);
    expect(res.body.data._isMock).toBe(true);
    expect(res.body.data._warning).toContain('SIMULATED REVERSAL');
  });

  it('cannot reverse an already-reversed claim', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims/${partialEventId}/reverse`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'second attempt' });
    expect(res.status).toBe(409);
  });
});

describe('Claim validation — realistic rejection scenarios', () => {
  let token: string;
  let practiceId: string;

  beforeAll(async () => {
    token = await registerAndLogin('validation@claim.synapsemed');
    const pr = await request(app).post('/api/v1/practices').set('Authorization', `Bearer ${token}`).send({ name: '[claim] Validation Practice', organisationType: 'group_practice' });
    practiceId = pr.body.data.id;
    await request(app).put(`/api/v1/practices/${practiceId}/modules/switch`).set('Authorization', `Bearer ${token}`).send({ status: 'active' });
    await request(app).post(`/api/v1/practices/${practiceId}/switch/activate`).set('Authorization', `Bearer ${token}`).send({});
  });

  const validBase = {
    bhfPracticeNumber: '1234567',
    treatingPractitionerHpcsa: 'MP0123456',
    schemeCode: 'DISC',
    membershipNumber: 'DISC1234567',
    serviceDate: new Date().toISOString().split('T')[0],
    principalDiagnosis: 'J06.9',
    lines: [{ code: '0191', codeType: 'tariff', quantity: 1, unitPriceZar: 650, diagnosisCodes: ['J06.9'] }],
  };

  it('rejects claim with invalid BHF practice number (not 7 digits)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBase, bhfPracticeNumber: 'ABC123' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('error');
    expect(res.body.data.claimRaCodes.some((r: any) => r.code === 'RA015')).toBe(true);
  });

  it('rejects claim with invalid ICD-10 code', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBase, principalDiagnosis: 'Z99.999' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('error');
    expect(res.body.data.claimRaCodes.some((r: any) => r.code === 'RA013')).toBe(true);
  });

  it('rejects claim with unknown scheme code', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBase, schemeCode: 'UNKNOWN' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('error');
    expect(res.body.data.claimRaCodes.some((r: any) => r.code === 'RA005')).toBe(true);
  });

  it('rejects claim with claim submitted beyond 4-month window', async () => {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 5);
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBase, serviceDate: oldDate.toISOString().split('T')[0] });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('error');
    expect(res.body.data.claimRaCodes.some((r: any) => r.code === 'RA007')).toBe(true);
  });

  it('rejects claim with missing required fields', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({ schemeCode: 'DISC' }); // missing most fields
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('partially pays claim with inflated tariff (>20% above scheme rate)', async () => {
    const res = await request(app)
      .post(`/api/v1/practices/${practiceId}/switch/claims`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validBase,
        lines: [{ code: '0191', codeType: 'tariff', quantity: 1, unitPriceZar: 1500, diagnosisCodes: ['J06.9'] }], // way above scheme rate
      });
    expect(res.status).toBe(201);
    expect(['partial', 'accepted']).toContain(res.body.data.status);
    // Should apply RA010 for amount exceeding scheme tariff
    const raCodes = res.body.data.claimRaCodes.map((r: any) => r.code);
    expect(raCodes).toContain('RA010');
  });
});
