import { prisma } from '../prisma';
import { getSwitchAdapter } from '../switch/AdapterFactory';

export async function autoSubmitPendingClaims(practiceId: string, actorId: string) {
  // Safe automation: claim submission requires validation and explicit human approval.
  // This function only prepares review items from draft switch usage events.
  const events = await prisma.switchUsageEvent.findMany({
    where: { connection: { practiceId }, status: 'draft' },
    include: { connection: { select: { providerName: true, environment: true } } },
    take: 10,
  }).catch(() => []);

  const results = events.map((event) => ({
    eventId: event.id,
    status: 'skipped' as const,
    reason: 'Auto-submission requires claim validation and explicit approval. Review in billing dashboard.',
  }));

  const adapter = getSwitchAdapter();
  return {
    processed: events.length,
    results,
    isMock: adapter.isMock,
    reviewRequired: true,
    submitted: 0,
    note: 'Claims were not submitted. Human review and explicit approval are required before any switch submission.',
    actorId,
  };
}

