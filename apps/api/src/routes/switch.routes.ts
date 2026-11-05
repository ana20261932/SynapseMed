import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { v4 as uuidv4 } from 'uuid';
import { getSwitchAdapter } from '../lib/switch/AdapterFactory';
import { SwitchClaim } from '../lib/switch/ISwitchAdapter';
import { SA_SCHEMES, TARIFF_CODES, NAPPI_CODES, ICD10_CODES, RA_CODES } from '../lib/switch/saReferenceData';

const router = Router({ mergeParams: true });

/**
 * Switch routes — full SA claim lifecycle via provider-independent adapter.
 *
 * MOCK environment: All transactions are simulated by MockSwitchAdapter.
 * isMock=true is enforced unless ALL of:
 *   - SWITCH_PROVIDER !== 'mock'
 *   - connection.environment === 'production'
 *   - connection.contractApproved === true
 *   - ENABLE_REAL_CLAIM_SUBMISSION === 'true'
 *
 * Every response carries _environment to make the operational context explicit.
 */

// ── Reference data endpoints (available without switch module) ────────────────

router.get('/reference/schemes', requireAuth, async (_req, res, next) => {
  try {
    res.json({ success: true, data: SA_SCHEMES } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/reference/tariffs', requireAuth, async (_req, res, next) => {
  try {
    res.json({ success: true, data: TARIFF_CODES } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/reference/nappi', requireAuth, async (_req, res, next) => {
  try {
    res.json({ success: true, data: NAPPI_CODES } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/reference/icd10', requireAuth, async (_req, res, next) => {
  try {
    res.json({ success: true, data: ICD10_CODES } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/reference/ra-codes', requireAuth, async (_req, res, next) => {
  try {
    res.json({ success: true, data: RA_CODES } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Connection ────────────────────────────────────────────────────────────────

router.get('/connection', requireAuth, requirePracticeMembership(['owner', 'admin']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    res.json({ success: true, data: conn ?? null } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/activate',
  requireAuth, requirePracticeMembership(['owner', 'admin']), requireModule('switch'),
  [body('providerName').optional().isString(), body('bhfPracticeNumber').optional().isString()],
  async (req: any, res: any, next: any) => {
    try {
      const { providerName = 'MockSwitch', bhfPracticeNumber } = req.body;
      const adapter = getSwitchAdapter();
      const conn = await prisma.switchProviderConnection.upsert({
        where: { practiceId: req.practiceId! },
        create: {
          practiceId: req.practiceId!,
          providerName,
          environment: adapter.isMock ? 'mock' : 'sandbox',
          connectionStatus: 'active',
          contractApproved: false,
          credentialRef: adapter.isMock ? 'MOCK_ONLY' : 'SANDBOX',
          ...(bhfPracticeNumber ? { credentialRef: bhfPracticeNumber } : {}),
        },
        update: {
          connectionStatus: 'active',
          providerName,
          environment: adapter.isMock ? 'mock' : 'sandbox',
          ...(bhfPracticeNumber ? { credentialRef: bhfPracticeNumber } : {}),
        },
      });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'switch.activate', resourceType: 'SwitchProviderConnection', resourceId: conn.id, metadata: { providerName, isMock: adapter.isMock } });
      res.json({
        success: true,
        data: {
          ...conn,
          _environment: conn.environment,
          _warning: adapter.isMock ? 'MOCK SWITCH — all claims are simulated. No real medical-aid submissions.' : 'SANDBOX — test environment only.',
        },
      } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// ── Claim submission ──────────────────────────────────────────────────────────

router.post('/claims',
  requireAuth,
  requirePracticeMembership(['owner', 'admin', 'billing_staff']),
  requireModule('switch'),
  [
    body('bhfPracticeNumber').notEmpty().withMessage('BHF practice number is required'),
    body('treatingPractitionerHpcsa').notEmpty().withMessage('Treating practitioner HPCSA number is required'),
    body('schemeCode').notEmpty().withMessage('Scheme code is required (e.g. DISC, GEMS)'),
    body('membershipNumber').notEmpty().withMessage('Medical aid membership number is required'),
    body('serviceDate').isISO8601().withMessage('Service date must be ISO 8601'),
    body('principalDiagnosis').notEmpty().withMessage('Principal ICD-10 diagnosis code is required'),
    body('lines').isArray({ min: 1 }).withMessage('At least one claim line is required'),
    body('lines.*.code').notEmpty(),
    body('lines.*.codeType').isIn(['tariff', 'nappi', 'procedure']),
    body('lines.*.quantity').isInt({ min: 1 }),
    body('lines.*.unitPriceZar').isFloat({ min: 0 }),
  ],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }

      const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
      if (!conn || conn.connectionStatus !== 'active') throw Errors.SWITCH_NOT_CONNECTED();

      // Enforce real-submission gate — all four conditions must hold for live
      const isRealSubmission =
        process.env.ENABLE_REAL_CLAIM_SUBMISSION === 'true' &&
        conn.environment === 'production' &&
        conn.contractApproved &&
        process.env.SWITCH_PROVIDER !== 'mock';

      if (isRealSubmission) {
        // Production path not yet implemented — provider adapter would handle this
        throw Errors.REAL_CLAIMS_DISABLED();
      }

      const body = req.body;
      const claimReference = `CLM-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

      const claim: SwitchClaim = {
        claimReference,
        serviceDate: body.serviceDate,
        bhfPracticeNumber: body.bhfPracticeNumber,
        treatingPractitionerHpcsa: body.treatingPractitionerHpcsa,
        schemeCode: body.schemeCode,
        planCode: body.planCode ?? 'standard',
        membershipNumber: body.membershipNumber,
        dependantCode: body.dependantCode ?? '00',
        principalDiagnosis: body.principalDiagnosis,
        additionalDiagnoses: body.additionalDiagnoses ?? [],
        lines: body.lines.map((l: any, idx: number) => ({
          lineNumber: idx + 1,
          code: l.code,
          codeType: l.codeType,
          description: l.description ?? l.code,
          quantity: l.quantity,
          unitPriceZar: l.unitPriceZar,
          totalPriceZar: +(l.unitPriceZar * l.quantity).toFixed(2),
          diagnosisCodes: l.diagnosisCodes ?? [body.principalDiagnosis],
        })),
        totalBilledZar: body.lines.reduce((s: number, l: any) => s + l.unitPriceZar * l.quantity, 0),
      };

      // Dispatch through adapter
      const adapter = getSwitchAdapter();
      const adjudication = await adapter.submitClaim(claim);

      // Persist usage event with full claim + adjudication JSON
      const event = await prisma.switchUsageEvent.create({
        data: {
          connectionId: conn.id,
          isMock: adapter.isMock,
          eventType: 'claim_submission',
          idempotencyKey: claimReference,
          providerRef: adjudication.schemeRef,
          status: adjudication.status === 'accepted' ? 'accepted'
                : adjudication.status === 'partial'  ? 'partial'
                : adjudication.status === 'rejected' ? 'rejected'
                : 'error',
          claimJson: JSON.stringify(claim),
          adjudicationJson: JSON.stringify(adjudication),
          adjudicationStatus: adjudication.status,
          schemeRef: adjudication.schemeRef,
          approvedAmountZar: adjudication.totalApprovedZar,
          rejectionCodes: adjudication.claimRaCodes.length ? adjudication.claimRaCodes.join(',') : null,
          providerFeeZar: 5.50,   // mock switch per-claim fee
          platformFeeZar: 1.50,   // platform per-claim fee
        },
      });

      await audit({
        actorId: req.user!.sub,
        practiceId: req.practiceId!,
        action: 'switch.claim_submit',
        resourceType: 'SwitchUsageEvent',
        resourceId: event.id,
        metadata: {
          isMock: adapter.isMock,
          claimReference,
          schemeRef: adjudication.schemeRef,
          status: adjudication.status,
          totalBilledZar: claim.totalBilledZar,
          approvedZar: adjudication.totalApprovedZar,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          eventId: event.id,
          claimReference,
          schemeRef: adjudication.schemeRef,
          status: adjudication.status,
          totalBilledZar: claim.totalBilledZar,
          totalApprovedZar: adjudication.totalApprovedZar,
          totalPatientLiableZar: adjudication.totalPatientLiableZar,
          lines: adjudication.lines,
          claimRaCodes: adjudication.claimRaCodes.map((c) => ({ code: c, description: RA_CODES[c]?.description ?? c })),
          messages: adjudication.messages,
          adjudicatedAt: adjudication.adjudicatedAt,
          _environment: conn.environment,
          _isMock: adjudication.isMock,
          _warning: adjudication.isMock
            ? '⚠ SIMULATED ADJUDICATION — not a real medical-aid claim submission. For demonstration only.'
            : undefined,
        },
      } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// ── Claim status ──────────────────────────────────────────────────────────────

router.get('/claims/:eventId', requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const event = await prisma.switchUsageEvent.findFirst({
      where: { id: req.params.eventId, connection: { practiceId: req.practiceId! } },
    });
    if (!event) throw Errors.NOT_FOUND('Claim event');

    let adjudication = null;
    if (event.adjudicationJson) {
      try { adjudication = JSON.parse(event.adjudicationJson); } catch { /* ignore */ }
    }

    res.json({
      success: true,
      data: {
        eventId: event.id,
        claimReference: event.idempotencyKey,
        schemeRef: event.schemeRef,
        status: event.status,
        adjudicationStatus: event.adjudicationStatus,
        approvedAmountZar: event.approvedAmountZar,
        rejectionCodes: event.rejectionCodes ? event.rejectionCodes.split(',').map((c: string) => ({ code: c, description: RA_CODES[c]?.description ?? c })) : [],
        adjudication,
        reversedAt: event.reversedAt,
        _isMock: event.isMock,
      },
    } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── List claims ───────────────────────────────────────────────────────────────

router.get('/claims', requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    if (!conn) return res.json({ success: true, data: [] } satisfies ApiResponse);
    const events = await prisma.switchUsageEvent.findMany({
      where: { connectionId: conn.id, eventType: 'claim_submission' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, idempotencyKey: true, schemeRef: true, status: true,
        adjudicationStatus: true, approvedAmountZar: true, rejectionCodes: true,
        isMock: true, reversedAt: true, createdAt: true, providerFeeZar: true, platformFeeZar: true,
      },
    });
    res.json({ success: true, data: events } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Reversal ──────────────────────────────────────────────────────────────────

router.post('/claims/:eventId/reverse',
  requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'),
  [body('reason').notEmpty().withMessage('Reason for reversal is required')],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const event = await prisma.switchUsageEvent.findFirst({
        where: { id: req.params.eventId, connection: { practiceId: req.practiceId! } },
      });
      if (!event) throw Errors.NOT_FOUND('Claim event');
      if (event.reversedAt) throw Errors.CONFLICT('Claim has already been reversed');
      if (!['accepted', 'partial'].includes(event.status)) {
        return res.status(422).json({ success: false, error: { code: 'REVERSAL_NOT_ALLOWED', message: `Cannot reverse a claim with status: ${event.status}` } });
      }

      const adapter = getSwitchAdapter();
      const reversal = await adapter.reverseClaim(event.schemeRef!, req.body.reason);

      const updated = await prisma.switchUsageEvent.update({
        where: { id: event.id },
        data: { status: 'reversed', reversedAt: new Date() },
      });

      await audit({
        actorId: req.user!.sub,
        practiceId: req.practiceId!,
        action: 'switch.claim_reverse',
        resourceType: 'SwitchUsageEvent',
        resourceId: event.id,
        metadata: { schemeRef: event.schemeRef, reversalRef: reversal.reversalRef, reason: req.body.reason, isMock: adapter.isMock },
      });

      res.json({
        success: true,
        data: {
          eventId: updated.id,
          reversalRef: reversal.reversalRef,
          status: 'reversed',
          reversedAt: reversal.reversedAt,
          _isMock: reversal.isMock,
          _warning: reversal.isMock ? 'SIMULATED REVERSAL — not a real claim reversal.' : undefined,
        },
      } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// ── Legacy events endpoint (backward compat) ──────────────────────────────────

router.post('/events', requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    if (!conn || conn.connectionStatus !== 'active') throw Errors.SWITCH_NOT_CONNECTED();
    const enableReal = process.env.ENABLE_REAL_CLAIM_SUBMISSION === 'true' && conn.environment === 'production' && conn.contractApproved;
    if (enableReal) throw Errors.REAL_CLAIMS_DISABLED();
    const { eventType, payload } = req.body;
    const event = await prisma.switchUsageEvent.create({
      data: { connectionId: conn.id, isMock: true, eventType, idempotencyKey: uuidv4(), status: 'simulated' }
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'switch.claim_submit', resourceType: 'SwitchUsageEvent', resourceId: event.id, metadata: { isMock: true, eventType } });
    res.status(201).json({ success: true, data: { ...event, _warning: 'SIMULATED TRANSACTION — not a real claim submission' } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/events', requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    if (!conn) return res.json({ success: true, data: [] } satisfies ApiResponse);
    const events = await prisma.switchUsageEvent.findMany({ where: { connectionId: conn.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: events } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Invoices ──────────────────────────────────────────────────────────────────

router.get('/invoices', requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const invoices = await prisma.switchInvoice.findMany({ where: { practiceId: req.practiceId! }, include: { lines: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: invoices } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/invoices/generate', requireAuth, requirePracticeMembership(['owner', 'admin', 'billing_staff']), requireModule('switch'), async (req: any, res: any, next: any) => {
  try {
    const conn = await prisma.switchProviderConnection.findUnique({ where: { practiceId: req.practiceId! } });
    if (!conn) throw Errors.SWITCH_NOT_CONNECTED();
    const { periodStart, periodEnd, lines } = req.body;
    const totalProviderFeesZar = (lines || []).reduce((s: number, l: any) => s + (l.providerFeeZar || 0), 0);
    const totalPlatformFeesZar = (lines || []).reduce((s: number, l: any) => s + (l.platformFeeZar || 0), 0);
    const totalZar = totalProviderFeesZar + totalPlatformFeesZar;
    const invoiceNumber = `SW-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
    const invoice = await prisma.switchInvoice.create({
      data: {
        connectionId: conn.id,
        practiceId: req.practiceId!,
        invoiceNumber,
        status: 'draft',
        totalProviderFeesZar,
        totalPlatformFeesZar,
        totalZar,
        vatZar: +(totalZar * 0.15).toFixed(2),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        lines: lines?.length ? {
          create: lines.map((l: any) => ({
            description: l.description || 'Switch fee',
            quantity: l.quantity || 1,
            unitPriceZar: (l.providerFeeZar || 0) + (l.platformFeeZar || 0),
            totalZar: ((l.providerFeeZar || 0) + (l.platformFeeZar || 0)) * (l.quantity || 1),
            lineType: l.lineType || 'fee',
          })),
        } : undefined,
      },
      include: { lines: true },
    });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'billing.invoice_create', resourceType: 'SwitchInvoice', resourceId: invoice.id, metadata: { invoiceNumber, totalZar, isMock: true } });
    res.status(201).json({ success: true, data: { ...invoice, _warning: 'SWITCH BILLING — SEPARATE FROM PMS SUBSCRIPTION' } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
