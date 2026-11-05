import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { ibmServices } from '../lib/ibm';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { Errors } from '../lib/errors';

const router = Router({ mergeParams: true });

// ── Cloudant document endpoints ─────────────────────────────────────────────
// Optional IBM Cloudant NoSQL document store. Falls back to mock/error when not configured.

router.get('/documents', requireAuth, requirePracticeMembership(), async (_req: any, res: any, next: any) => {
  try {
    if (!ibmServices.cloudant.isConfigured()) {
      return res.json({
        success: true,
        data: { documents: [], provider: 'cloudant-mock', isMock: true, _warning: 'Cloudant not configured — set CLOUDANT_URL and CLOUDANT_API_KEY.' },
      } satisfies ApiResponse);
    }
    const adapter = ibmServices.cloudant.create();
    const docs = await adapter.query({});
    res.json({ success: true, data: { documents: docs, provider: adapter.providerName, isMock: adapter.isMock } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/documents', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']),
  [body('document').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      if (!ibmServices.cloudant.isConfigured()) {
        return res.status(501).json({
          success: false,
          error: { code: 'CLOUDANT_NOT_CONFIGURED', message: 'Cloudant is not configured. Set CLOUDANT_URL and CLOUDANT_API_KEY.' },
        } satisfies ApiResponse);
      }
      const adapter = ibmServices.cloudant.create();
      const doc = await adapter.create(req.body.document);
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'document.register' as any, resourceType: 'Document', resourceId: doc._id, metadata: { provider: adapter.providerName, isMock: adapter.isMock } });
      res.status(201).json({ success: true, data: { ...doc, provider: adapter.providerName, isMock: adapter.isMock } } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

router.get('/documents/:id', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    if (!ibmServices.cloudant.isConfigured()) {
      return res.status(501).json({
        success: false,
        error: { code: 'CLOUDANT_NOT_CONFIGURED', message: 'Cloudant is not configured.' },
      } satisfies ApiResponse);
    }
    const adapter = ibmServices.cloudant.create();
    const doc = await adapter.get(req.params.id);
    if (!doc) throw Errors.NOT_FOUND('Document');
    res.json({ success: true, data: { ...doc, provider: adapter.providerName, isMock: adapter.isMock } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.delete('/documents/:id', requireAuth, requirePracticeMembership(['owner','admin']),
  async (req: any, res: any, next: any) => {
    try {
      if (!ibmServices.cloudant.isConfigured()) {
        return res.status(501).json({
          success: false,
          error: { code: 'CLOUDANT_NOT_CONFIGURED', message: 'Cloudant is not configured.' },
        } satisfies ApiResponse);
      }
      const adapter = ibmServices.cloudant.create();
      // Rev not required for mock; real impl would need it
      await adapter.delete(req.params.id, 'mock-rev');
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'document.delete' as any, resourceType: 'Document', resourceId: req.params.id });
      res.json({ success: true, data: { id: req.params.id, deleted: true } } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// ── Cloudant status ─────────────────────────────────────────────────────────

router.get('/status', requireAuth, requirePracticeMembership(), async (_req: any, res: any, next: any) => {
  try {
    res.json({
      success: true,
      data: {
        provider: 'ibm-cloudant',
        configured: ibmServices.cloudant.isConfigured(),
        isMock: !ibmServices.cloudant.isConfigured(),
        dbName: process.env.CLOUDANT_DB_NAME || 'synapsemed',
        _warning: ibmServices.cloudant.isConfigured() ? undefined : 'Cloudant not configured — document operations will return not-implemented errors.',
      },
    } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
