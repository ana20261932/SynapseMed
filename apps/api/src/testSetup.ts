/**
 * Jest globalSetup — prepares the test database before all test suites.
 * - Clears all transient/test data (users, practices, audit events, tokens).
 * - Seeds required reference data (subscription plans).
 *
 * Runs once before any test suite in the process.
 */
import { PrismaClient } from '@prisma/client';

export default async function globalSetup(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    // Clear all transient data in dependency order so FK constraints are satisfied.
    // Reference data (SubscriptionPlan) is preserved and upserted below.
    await prisma.switchInvoiceLine.deleteMany();
    await prisma.switchInvoice.deleteMany();
    await prisma.switchUsageEvent.deleteMany();
    await prisma.switchFeeRule.deleteMany();
    await prisma.switchProviderConnection.deleteMany();
    await prisma.pmsInvoiceLine.deleteMany();
    await prisma.pmsInvoice.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.paymentEvent.deleteMany();
    await prisma.paymentMethodToken.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.document.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.clinicalNote.deleteMany();
    await prisma.encounter.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.patientConsent.deleteMany();
    try { await prisma.treatmentPlanItem.deleteMany(); } catch {}
    try { await prisma.treatmentPlan.deleteMany(); } catch {}
    try { await prisma.toothEntry.deleteMany(); } catch {}
    try { await prisma.odontogramChart.deleteMany(); } catch {}
    await prisma.odontogramChart.deleteMany();
    await prisma.radiologyReport.deleteMany();
    await prisma.radiologyOrder.deleteMany();
    await prisma.mentalHealthRecord.deleteMany();
    await prisma.alliedHealthSession.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.extensionInstallLog.deleteMany();
    await prisma.practiceExtensionEntitlement.deleteMany();
    await prisma.moduleEntitlement.deleteMany();
    await prisma.practiceNumber.deleteMany();
    await prisma.specialtyConfiguration.deleteMany();
    await prisma.transcriptionJob.deleteMany();
    await prisma.aiUsageLedger.deleteMany();
    await prisma.aiJob.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.practiceMembership.deleteMany();
    await prisma.professionalProfile.deleteMany();
    await prisma.practice.deleteMany();
    await prisma.organisation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.extensionVersion.deleteMany();
    await prisma.extension.deleteMany();

    // Seed required reference data
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Free' },
      create: { name: 'Free', description: 'Free tier', priceZar: 0, billingPeriod: 'monthly', maxUsers: 2, featureFlags: JSON.stringify(['patients', 'scheduling']) },
      update: {},
    });
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Starter' },
      create: { name: 'Starter', description: 'Starter practice plan', priceZar: 499, billingPeriod: 'monthly', maxUsers: 5, featureFlags: JSON.stringify(['patients', 'scheduling', 'billing', 'clinical']) },
      update: {},
    });
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Professional' },
      create: { name: 'Professional', description: 'Professional plan', priceZar: 1499, billingPeriod: 'monthly', maxUsers: 15, featureFlags: JSON.stringify(['patients', 'scheduling', 'billing', 'clinical', 'inventory', 'ai']) },
      update: {},
    });
  } finally {
    await prisma.$disconnect();
  }
}
