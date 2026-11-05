import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { ibmServices } from '../lib/ibm';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse']), requireModule('ai_admin'), async (req: any, res: any, next: any) => {
  try {
    const { audioBase64, contentType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'audioBase64 is required' } });
    }
    const buffer = Buffer.from(audioBase64, 'base64');
    const adapter = ibmServices.speechToText.create();
    const result = await adapter.transcribeAudio(buffer, { contentType });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'transcription.create', resourceType: 'Transcription', metadata: { bytes: buffer.length, provider: adapter.providerName, isMock: adapter.isMock } });
    res.json({ success: true, data: { ...result, provider: adapter.providerName } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
