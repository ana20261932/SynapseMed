import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Subscription plans
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Free' },
    create: { name: 'Free', description: 'Free tier', priceZar: 0, billingPeriod: 'monthly', maxUsers: 2, featureFlags: JSON.stringify(['patients','scheduling']) },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    create: { name: 'Starter', description: 'Starter practice plan', priceZar: 499, billingPeriod: 'monthly', maxUsers: 5, featureFlags: JSON.stringify(['patients','scheduling','billing','clinical']) },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Professional' },
    create: { name: 'Professional', description: 'Professional plan', priceZar: 1499, billingPeriod: 'monthly', maxUsers: 15, featureFlags: JSON.stringify(['patients','scheduling','billing','clinical','inventory','ai']) },
    update: {},
  });
  console.log('Seeded subscription plans');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
