/**
 * SynapseMed — Synthetic seed data for development/demo only.
 * Never use real patient data. Only runs when USE_SYNTHETIC_DATA=true.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.USE_SYNTHETIC_DATA !== 'true') {
    console.warn('[seed] USE_SYNTHETIC_DATA is not true — aborting');
    return;
  }
  console.log('[seed] Seeding synthetic data…');

  // Plans
  await prisma.subscriptionPlan.upsert({ where: { name: 'Free' }, create: { name: 'Free', description: 'Limited demo plan', priceZar: 0, billingPeriod: 'monthly', maxUsers: 1, featureFlags: JSON.stringify(['scheduling','clinical_notes']) }, update: {} });
  await prisma.subscriptionPlan.upsert({ where: { name: 'Solo Essentials' }, create: { name: 'Solo Essentials', priceZar: 149, billingPeriod: 'monthly', maxUsers: 2, featureFlags: JSON.stringify(['scheduling','clinical_notes','billing','prescriptions']) }, update: {} });
  await prisma.subscriptionPlan.upsert({ where: { name: 'Growing Practice' }, create: { name: 'Growing Practice', priceZar: 449, billingPeriod: 'monthly', maxUsers: 10, featureFlags: JSON.stringify(['scheduling','clinical_notes','billing','prescriptions','inventory','ai_admin','patient_portal','advanced_reporting']) }, update: {} });

  // Users
  const pw = await bcrypt.hash('DemoPass!2024', 12);
  const owner = await prisma.user.upsert({ where: { email: 'demo.owner@synapsemed.local' }, create: { email: 'demo.owner@synapsemed.local', passwordHash: pw, firstName: 'Demo', lastName: 'Owner', emailVerified: true }, update: {} });
  const practitioner = await prisma.user.upsert({ where: { email: 'demo.doctor@synapsemed.local' }, create: { email: 'demo.doctor@synapsemed.local', passwordHash: pw, firstName: 'Dr Sarah', lastName: 'Dlamini', emailVerified: true }, update: {} });

  // Professional profile
  await prisma.professionalProfile.upsert({ where: { userId: practitioner.id }, create: { userId: practitioner.id, discipline: 'general_practitioner', councilBody: 'HPCSA', registrationNumber: 'MP-DEMO-0001', registrationStatus: 'unverified', verificationNotes: 'Synthetic demo data — not a real registration' }, update: {} });

  // Org + Practice
  let org = await prisma.organisation.findFirst({ where: { name: 'Demo Family Practice' } });
  if (!org) org = await prisma.organisation.create({ data: { name: 'Demo Family Practice', type: 'group_practice' } });
  let practice = await prisma.practice.findFirst({ where: { organisationId: org.id } });
  if (!practice) practice = await prisma.practice.create({ data: { organisationId: org.id, name: 'Demo Family Practice', phone: '+27110000000', email: 'reception@synapsemed.local', address: '1 Synthetic Street, Demo City, Gauteng', timezone: 'Africa/Johannesburg' } });

  // Memberships
  await prisma.practiceMembership.upsert({ where: { practiceId_userId: { practiceId: practice.id, userId: owner.id } }, create: { practiceId: practice.id, userId: owner.id, role: 'owner', status: 'active', acceptedAt: new Date() }, update: {} });
  await prisma.practiceMembership.upsert({ where: { practiceId_userId: { practiceId: practice.id, userId: practitioner.id } }, create: { practiceId: practice.id, userId: practitioner.id, role: 'practitioner', status: 'active', acceptedAt: new Date() }, update: {} });

  // Module entitlements
  for (const moduleKey of ['scheduling','clinical_notes','billing','prescriptions','inventory']) {
    await prisma.moduleEntitlement.upsert({ where: { practiceId_moduleKey: { practiceId: practice.id, moduleKey } }, create: { practiceId: practice.id, moduleKey, status: 'active', enabledAt: new Date() }, update: { status: 'active' } });
  }

  // Synthetic patients
  for (const p of [
    { firstName: 'John', lastName: 'Synthetic', dateOfBirth: new Date('1985-03-12'), gender: 'male' },
    { firstName: 'Aisha', lastName: 'Demo', dateOfBirth: new Date('1992-07-21'), gender: 'female' },
    { firstName: 'Thabo', lastName: 'Test', dateOfBirth: new Date('1978-11-05'), gender: 'male' },
  ]) {
    const ex = await prisma.patient.findFirst({ where: { practiceId: practice.id, firstName: p.firstName, lastName: p.lastName } });
    if (!ex) await prisma.patient.create({ data: { ...p, practiceId: practice.id } });
  }

  // Mock switch connection
  await prisma.switchProviderConnection.upsert({ where: { practiceId: practice.id }, create: { practiceId: practice.id, providerName: 'MockSwitch', environment: 'mock', connectionStatus: 'active', contractApproved: false }, update: {} });

  console.log('[seed] Done. Login: demo.owner@synapsemed.local / DemoPass!2024');
  console.log('[seed] ⚠️  SYNTHETIC DATA — never use real patient information.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
