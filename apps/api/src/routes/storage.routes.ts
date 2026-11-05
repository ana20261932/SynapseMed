import { Router } from 'express';
import { getStorageAdapter } from '../lib/storage/MockStorageAdapter';
import { getCOSAdapter } from '../lib/storage/CloudObjectStorageAdapter';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

function getAdapter() {
  const provider = process.env.OBJECT_STORAGE_PROVIDER || process.env.STORAGE_PROVIDER || 'mock';
  if (provider === 'ibm-cos' || provider === 'cos') {
    return getCOSAdapter();
  }
  return getStorageAdapter();
}

router.post('/upload-url', requireAuth, requirePracticeMembership(['owner','admin','practitioner','nurse','receptionist']), async (req: any, res: any, next: any) => {
  try {
    const { fileName, mimeType } = req.body;
    const adapter = getAdapter();
    const result = await adapter.getUploadUrl({ practiceId: req.practiceId!, fileName, mimeType });
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'document.register' as any, resourceType: 'Document', metadata: { fileName, mimeType, provider: adapter.providerName, type: 'storage.upload_url' } });
    res.json({ success: true, data: { ...result, provider: adapter.providerName, isMock: adapter.isMock } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.get('/download-url', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const { objectKey } = req.query;
    if (!objectKey || typeof objectKey !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'objectKey is required' } });
    }
    const adapter = getAdapter();
    const url = await adapter.getDownloadUrl(objectKey);
    res.json({ success: true, data: { downloadUrl: url, provider: adapter.providerName } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
