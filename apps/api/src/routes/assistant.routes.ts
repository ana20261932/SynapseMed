import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { ibmServices } from '../lib/ibm';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { Errors } from '../lib/errors';

const router = Router({ mergeParams: true });

router.post('/message',
  requireAuth, requirePracticeMembership(), requireModule('ai_admin'),
  [body('text').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { text, sessionId, context } = req.body;
      const adapter = ibmServices.watsonAssistant.create();
      const response = await adapter.sendMessage(sessionId || null, { text, context });
      await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'ai_job.create' as any, resourceType: 'AiJob', metadata: { provider: adapter.providerName, isMock: adapter.isMock, type: 'assistant.message' } });
      res.json({ success: true, data: { ...response, provider: adapter.providerName, isMock: adapter.isMock } } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
