import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { prisma } from '../lib/prisma';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';
import { getAvailableProviders } from '../lib/ai/aiProviderFactory';

const router = Router({ mergeParams: true });

router.get('/ai', requireAuth, requirePracticeMembership(['owner','admin']), async (req: any, res: any, next: any) => {
  try {
    let settings = await prisma.practiceAISettings.findUnique({ where: { practiceId: req.practiceId! } });
    if (!settings) {
      settings = await prisma.practiceAISettings.create({ data: { practiceId: req.practiceId! } });
    }
    // Don't expose full API keys
    const safe = {
      ...settings,
      geminiApiKey: settings.geminiApiKey ? '••••••••' + settings.geminiApiKey.slice(-4) : null,
      watsonxApiKey: settings.watsonxApiKey ? '••••••••' + settings.watsonxApiKey.slice(-4) : null,
      opencodeApiKey: settings.opencodeApiKey ? '••••••••' + settings.opencodeApiKey.slice(-4) : null,
    };
    res.json({ success: true, data: { settings: safe, availableProviders: getAvailableProviders() } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.put('/ai', requireAuth, requirePracticeMembership(['owner','admin']), async (req: any, res: any, next: any) => {
  try {
    const {
      aiProvider, geminiApiKey, geminiModel, watsonxApiKey, watsonxProjectId, watsonxModelId, watsonxUrl,
      opencodeApiKey, opencodeBaseUrl, opencodeModel,
      autoTaskReminders, autoDoctorSetup, autoClaimBilling, reminderHoursBefore
    } = req.body;

    const data: any = {
      aiProvider, geminiModel, watsonxProjectId, watsonxModelId, watsonxUrl,
      opencodeBaseUrl, opencodeModel,
      autoTaskReminders, autoDoctorSetup, autoClaimBilling, reminderHoursBefore,
    };
    // Only update keys if provided (not masked)
    if (geminiApiKey && !geminiApiKey.startsWith('••••')) data.geminiApiKey = geminiApiKey;
    if (watsonxApiKey && !watsonxApiKey.startsWith('••••')) data.watsonxApiKey = watsonxApiKey;
    if (opencodeApiKey && !opencodeApiKey.startsWith('••••')) data.opencodeApiKey = opencodeApiKey;

    const settings = await prisma.practiceAISettings.upsert({
      where: { practiceId: req.practiceId! },
      create: { practiceId: req.practiceId!, ...data },
      update: data,
    });

    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'practice.settings.update' as any, resourceType: 'Practice', resourceId: req.practiceId!, metadata: { section: 'ai' } });
    res.json({ success: true, data: settings } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
