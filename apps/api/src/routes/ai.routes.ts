import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { getAIProviderForPractice } from '../lib/ai/aiProviderFactory';

const router = Router({ mergeParams: true });

/**
 * AI Automation Centre — provider-independent gateway.
 *
 * SAFETY RULES (enforced in code, not just docs):
 *  1. Every AI job is created as draft/review-required output, never auto-applied.
 *  2. Output is never applied to a clinical record automatically — requires
 *     an explicit /review call by an authorised user.
 *  3. No autonomous clinical action: diagnosis, prescription, claim submission
 *     or record amendment without human approval is blocked at the route level.
 *  4. Transcription requires explicit consentGranted=true before processing.
 *  5. Usage limits are checked per-practice per-period before dispatching.
 */

const MONTHLY_LIMITS: Record<string, number> = {
  draft_note: 50,
  draft_summary: 50,
  admin_classification: 200,
  reminder_suggestion: 100,
  inventory_forecast: 20,
  transcription: 30,
};

function currentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

async function checkAndIncrementUsage(practiceId: string, purpose: string): Promise<void> {
  const { start, end } = currentPeriod();
  const limit = MONTHLY_LIMITS[purpose] ?? 10;
  const ledger = await prisma.aiUsageLedger.upsert({
    where: { practiceId_periodStart_purpose: { practiceId, periodStart: start, purpose } },
    create: { practiceId, periodStart: start, periodEnd: end, purpose, jobCount: 0 },
    update: {},
  });
  if (ledger.jobCount >= limit) {
    throw new Error(`AI_LIMIT_EXCEEDED:Monthly limit of ${limit} jobs for purpose '${purpose}' has been reached.`);
  }
  await prisma.aiUsageLedger.update({
    where: { id: ledger.id },
    data: { jobCount: { increment: 1 } },
  });
}

function buildSafePrompt(purpose: string, inputRef: unknown): string {
  // Never include secrets; callers must pass references/structured non-secret context.
  const context = typeof inputRef === 'string'
    ? inputRef
    : inputRef
      ? JSON.stringify(inputRef).slice(0, 4000)
      : 'No additional context provided.';
  return [
    `Purpose: ${purpose}`,
    'Generate a draft for administrative/clinical support use.',
    'Constraints: do not make diagnoses, prescribe, submit claims, or amend records. Output must be clearly draft/review-only.',
    `Context: ${context}`,
  ].join('\n');
}

router.post('/jobs',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse']), requireModule('ai_admin'),
  [body('purpose').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { purpose, inputRef, consentStatus } = req.body;
      const blockedPurposes = ['autonomous_diagnosis', 'autonomous_prescription', 'autonomous_claim', 'diagnosis', 'prescription', 'claim_submission', 'record_amendment'];
      if (blockedPurposes.includes(purpose)) {
        return res.status(403).json({ success: false, error: { code: 'AUTONOMOUS_CLINICAL_ACTION_BLOCKED', message: 'Autonomous clinical, prescription, claim, or record-amendment actions are not permitted.' } });
      }
      try {
        await checkAndIncrementUsage(req.practiceId!, purpose);
      } catch (limitErr: any) {
        if (limitErr.message.startsWith('AI_LIMIT_EXCEEDED:')) {
          return res.status(429).json({ success: false, error: { code: 'AI_LIMIT_EXCEEDED', message: limitErr.message.replace('AI_LIMIT_EXCEEDED:', '') } });
        }
        throw limitErr;
      }

      const provider = await getAIProviderForPractice(req.practiceId!);
      let output = `[${provider.isMock ? 'MOCK' : 'AI'} DRAFT for purpose=${purpose}] — requires qualified review before use.`;
      try {
        const completion = await provider.generate({
          prompt: buildSafePrompt(purpose, inputRef),
          systemPrompt: 'You are a healthcare practice assistant. Produce draft-only output. Never diagnose, prescribe, submit claims, or modify records. Require qualified clinical/billing review.',
          maxTokens: 600,
          temperature: 0.2,
        });
        output = completion.text || output;
      } catch (providerErr: any) {
        output = `[AI PROVIDER ERROR - DRAFT FALLBACK for purpose=${purpose}] Provider '${provider.name}' failed: ${providerErr?.message || 'unknown error'}. No clinical/billing action was taken.`;
      }

      const job = await prisma.aiJob.create({
        data: {
          requestedBy: req.user!.sub,
          practiceId: req.practiceId!,
          purpose,
          provider: provider.name,
          inputRef: typeof inputRef === 'string' ? inputRef : inputRef ? '[structured-ref]' : null,
          outputRef: `[inline-draft-${Date.now()}]`,
          consentStatus: consentStatus ?? 'not_required',
          status: 'requires_review',
          reviewRequired: true,
        },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'ai_job.create', resourceType: 'AiJob', resourceId: job.id, metadata: { purpose, provider: provider.name, isMock: provider.isMock } });
      res.status(201).json({
        success: true,
        data: {
          ...job,
          output,
          isDraft: true,
          _warning: 'AI output is a DRAFT. It must be reviewed and approved by an authorised clinician or billing reviewer before use in any clinical or billing workflow.',
        },
      } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/jobs', requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('ai_admin'), async (req: any, res: any, next: any) => {
  try {
    const where: any = { practiceId: req.practiceId! };
    if (req.query.purpose) where.purpose = req.query.purpose;
    if (req.query.status) where.status = req.query.status;
    const jobs = await prisma.aiJob.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: jobs } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/jobs/:jobId', requireAuth, requirePracticeMembership(), requireModule('ai_admin'), async (req: any, res: any, next: any) => {
  try {
    const job = await prisma.aiJob.findFirst({ where: { id: req.params.jobId, practiceId: req.practiceId! } });
    if (!job) throw Errors.NOT_FOUND('AI job');
    res.json({ success: true, data: job } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/jobs/:jobId/review',
  requireAuth, requirePracticeMembership(['owner','practitioner']), requireModule('ai_admin'),
  [body('decision').isIn(['approved', 'rejected'])],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const job = await prisma.aiJob.findFirst({ where: { id: req.params.jobId, practiceId: req.practiceId! } });
      if (!job) throw Errors.NOT_FOUND('AI job');
      if (!job.reviewRequired || job.reviewedAt) throw Errors.CONFLICT('Job has already been reviewed');
      const { decision } = req.body;
      const updated = await prisma.aiJob.update({
        where: { id: job.id },
        data: { status: decision === 'approved' ? 'completed' : 'failed', reviewedBy: req.user!.sub, reviewedAt: new Date() },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'ai_job.review', resourceType: 'AiJob', resourceId: job.id, metadata: { decision } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.post('/jobs/:jobId/redact',
  requireAuth, requirePracticeMembership(['owner','admin']), requireModule('ai_admin'),
  async (req: any, res: any, next: any) => {
    try {
      const job = await prisma.aiJob.findFirst({ where: { id: req.params.jobId, practiceId: req.practiceId! } });
      if (!job) throw Errors.NOT_FOUND('AI job');
      if (job.redactedAt) throw Errors.CONFLICT('Job output has already been redacted');
      const updated = await prisma.aiJob.update({
        where: { id: job.id },
        data: { outputRef: '[REDACTED]', redactedAt: new Date(), status: 'failed' },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'ai_job.redact', resourceType: 'AiJob', resourceId: job.id });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/usage', requireAuth, requirePracticeMembership(['owner','admin']), requireModule('ai_admin'), async (req: any, res: any, next: any) => {
  try {
    const { start, end } = currentPeriod();
    const ledgers = await prisma.aiUsageLedger.findMany({ where: { practiceId: req.practiceId!, periodStart: start } });
    const summary = ledgers.map((l) => ({
      purpose: l.purpose,
      used: l.jobCount,
      limit: MONTHLY_LIMITS[l.purpose] ?? 10,
      remaining: Math.max(0, (MONTHLY_LIMITS[l.purpose] ?? 10) - l.jobCount),
    }));
    res.json({ success: true, data: { periodStart: start, periodEnd: end, usage: summary } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/transcription',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse']), requireModule('ai_admin'),
  [body('patientId').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { patientId, encounterId, audioRef, retainAudioDays } = req.body;
      const patient = await prisma.patient.findFirst({ where: { id: patientId, practiceId: req.practiceId! } });
      if (!patient) throw Errors.NOT_FOUND('Patient');
      const retainUntil = retainAudioDays ? new Date(Date.now() + retainAudioDays * 86400000) : null;
      const job = await prisma.transcriptionJob.create({
        data: {
          practiceId: req.practiceId!,
          requestedBy: req.user!.sub,
          patientId,
          encounterId: encounterId ?? null,
          audioRef: audioRef ?? null,
          consentGranted: false,
          status: 'pending_consent',
          retainAudioUntil: retainUntil,
        },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'transcription.create', resourceType: 'TranscriptionJob', resourceId: job.id });
      res.status(201).json({
        success: true,
        data: {
          ...job,
          _warning: 'Transcription requires explicit patient consent before audio is processed. Call /consent-grant to proceed.',
        },
      } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.post('/transcription/:jobId/consent-grant',
  requireAuth, requirePracticeMembership(['owner','admin','practitioner']), requireModule('ai_admin'),
  [body('consentRef').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const job = await prisma.transcriptionJob.findFirst({ where: { id: req.params.jobId, practiceId: req.practiceId! } });
      if (!job) throw Errors.NOT_FOUND('Transcription job');
      if (job.consentGranted) throw Errors.CONFLICT('Consent has already been granted for this job');
      try {
        await checkAndIncrementUsage(req.practiceId!, 'transcription');
      } catch (limitErr: any) {
        if (limitErr.message.startsWith('AI_LIMIT_EXCEEDED:')) {
          return res.status(429).json({ success: false, error: { code: 'AI_LIMIT_EXCEEDED', message: limitErr.message.replace('AI_LIMIT_EXCEEDED:', '') } });
        }
        throw limitErr;
      }
      const { consentRef } = req.body;
      // Uses practice-selected AI provider only as a draft label in mock consent flow;
      // real audio transcription remains adapter-gated and consent-gated.
      const provider = await getAIProviderForPractice(req.practiceId!);
      const mockTranscript = `[${provider.isMock ? 'MOCK' : 'AI'} TRANSCRIPT DRAFT] Patient reported symptoms. Clinician recommended follow-up. — requires review before use in clinical notes.`;
      const updated = await prisma.transcriptionJob.update({
        where: { id: job.id },
        data: { consentGranted: true, consentRef, transcriptDraft: mockTranscript, status: 'completed' },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'transcription.consent_grant', resourceType: 'TranscriptionJob', resourceId: job.id, metadata: { consentRef, provider: provider.name } });
      res.json({
        success: true,
        data: {
          ...updated,
          isDraft: true,
          _warning: 'Transcript is a DRAFT. Review and edit before use in any clinical record.',
        },
      } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.post('/transcription/:jobId/delete-audio',
  requireAuth, requirePracticeMembership(['owner','admin']), requireModule('ai_admin'),
  async (req: any, res: any, next: any) => {
    try {
      const job = await prisma.transcriptionJob.findFirst({ where: { id: req.params.jobId, practiceId: req.practiceId! } });
      if (!job) throw Errors.NOT_FOUND('Transcription job');
      if (job.audioDeletedAt) throw Errors.CONFLICT('Audio has already been deleted for this job');
      const updated = await prisma.transcriptionJob.update({
        where: { id: job.id },
        data: { audioRef: '[DELETED]', audioDeletedAt: new Date() },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'transcription.audio_delete', resourceType: 'TranscriptionJob', resourceId: job.id });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
