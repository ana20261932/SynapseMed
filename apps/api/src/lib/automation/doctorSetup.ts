import { prisma } from '../prisma';
import { getAIProviderForPractice } from '../ai/aiProviderFactory';

type SetupTask = {
  key: string;
  title: string;
  status: 'pending_review';
  reason: string;
};

export async function generateDoctorSetupChecklist(practiceId: string) {
  // Safe automation: produces a draft checklist only. It does not change roles,
  // verify registrations, enable modules, submit claims, or access clinical data.
  const [practitioners, settings] = await Promise.all([
    prisma.practiceMembership.findMany({
      where: { practiceId, role: { in: ['practitioner', 'owner'] }, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            professionalProfile: { select: { discipline: true, councilBody: true, registrationNumber: true, registrationStatus: true } },
          },
        },
      },
      take: 50,
    }),
    prisma.practiceAISettings.findUnique({ where: { practiceId } }),
  ]);

  const baseTasks: SetupTask[] = [
    { key: 'profile_review', title: 'Review practitioner profile details', status: 'pending_review', reason: 'Human verification required before any profile change.' },
    { key: 'registration_verify', title: 'Verify professional registration with the appropriate council', status: 'pending_review', reason: 'Registration verification must be performed by an authorized administrator/process.' },
    { key: 'modules_review', title: 'Review required practice modules and entitlements', status: 'pending_review', reason: 'Module changes require explicit administrative action and billing/permission checks.' },
    { key: 'consent_workflow', title: 'Confirm consent and POPIA-aligned data handling workflow', status: 'pending_review', reason: 'Data handling decisions require practice governance review.' },
    { key: 'billing_review', title: 'Review billing/switch configuration before use', status: 'pending_review', reason: 'Claim submission requires validation and explicit human approval; no autonomous submissions.' },
  ];

  const checklist = practitioners.map((m) => {
    const profile = m.user.professionalProfile;
    const missing: string[] = [];
    if (!profile?.discipline) missing.push('discipline');
    if (!profile?.councilBody) missing.push('council body');
    if (!profile?.registrationNumber) missing.push('registration number');
    if (profile?.registrationStatus !== 'verified') missing.push('verified registration status');
    return {
      userId: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email,
      role: m.role,
      registrationStatus: profile?.registrationStatus ?? 'missing_profile',
      missing,
      tasks: baseTasks,
    };
  });

  let aiSummary: string | null = null;
  try {
    const provider = await getAIProviderForPractice(practiceId);
    const prompt = [
      'Create a concise onboarding checklist summary for practice administrators.',
      'Rules: draft only; require human review; do not instruct autonomous clinical, registration verification, module enablement, or claim submission actions.',
      `Practitioners: ${JSON.stringify(checklist.map(c => ({ name: c.name, role: c.role, registrationStatus: c.registrationStatus, missing: c.missing })))}`,
    ].join('\n');
    const res = await provider.generate({ prompt, systemPrompt: 'You generate safe administrative draft checklists for healthcare practice setup.', maxTokens: 300, temperature: 0.1 });
    aiSummary = res.text;
  } catch {
    aiSummary = null;
  }

  return {
    practiceId,
    aiProvider: settings?.aiProvider ?? 'mock',
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    isDraft: true,
    warning: 'Doctor setup output is a draft checklist. It requires administrator review and does not change access, verification status, modules, or submit claims.',
    practitionersReviewed: checklist.length,
    checklist,
    aiSummary,
  };
}
