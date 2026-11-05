import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership, requireModule } from '../middleware/requirePracticeMembership';
import { generateDoctorTaskReminders } from '../lib/automation/taskReminders';
import { autoSubmitPendingClaims } from '../lib/automation/autoClaimBilling';
import { generateDoctorSetupChecklist } from '../lib/automation/doctorSetup';
import { prisma } from '../lib/prisma';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

router.post('/run-reminders', requireAuth, requirePracticeMembership(['owner','admin']), requireModule('ai_admin'), async (req: any, res: any, next: any) => {
  try {
    const settings = await prisma.practiceAISettings.findUnique({ where: { practiceId: req.practiceId! } });
    if (!settings?.autoTaskReminders) {
      return res.status(400).json({ success: false, error: { code: 'AUTOMATION_DISABLED', message: 'Auto task reminders are disabled in settings' } });
    }
    const reminders = await generateDoctorTaskReminders(req.practiceId!, settings.reminderHoursBefore || 24);
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'ai_job.create' as any, resourceType: 'AiJob', metadata: { type: 'automation.reminders', count: reminders.length } });
    res.json({ success: true, data: { reminders, count: reminders.length } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/run-doctor-setup', requireAuth, requirePracticeMembership(['owner','admin']), requireModule('ai_admin'), async (req: any, res: any, next: any) => {
  try {
    const settings = await prisma.practiceAISettings.findUnique({ where: { practiceId: req.practiceId! } });
    if (!settings?.autoDoctorSetup) {
      return res.status(400).json({ success: false, error: { code: 'AUTOMATION_DISABLED', message: 'Auto doctor setup is disabled in settings' } });
    }
    const result = await generateDoctorSetupChecklist(req.practiceId!);
    await audit({
      actorId: req.user!.sub,
      practiceId: req.practiceId!,
      action: 'ai_job.create' as any,
      resourceType: 'Practice',
      resourceId: req.practiceId!,
      metadata: { type: 'automation.doctor_setup', practitionersReviewed: result.practitionersReviewed, reviewRequired: true },
    });
    res.json({
      success: true,
      data: {
        ...result,
        message: 'Doctor setup checklist generated (draft). Review required; no access, verification, module, or claim changes were made.',
      },
    } satisfies ApiResponse);

  } catch (err) { next(err); }
});

router.post('/run-claim-billing', requireAuth, requirePracticeMembership(['owner','admin']), requireModule('switch_billing'), async (req: any, res: any, next: any) => {
  try {
    const settings = await prisma.practiceAISettings.findUnique({ where: { practiceId: req.practiceId! } });
    if (!settings?.autoClaimBilling) {
      return res.status(400).json({ success: false, error: { code: 'AUTOMATION_DISABLED', message: 'Auto claim billing is disabled in settings' } });
    }
    const result = await autoSubmitPendingClaims(req.practiceId!, req.user!.sub);
    await audit({ actorId: req.user!.sub, practiceId: req.practiceId!, action: 'switch.claim.submit' as any, resourceType: 'ClaimEvent', metadata: { type: 'automation.claim_billing', ...result } });
    res.json({
      success: true,
      data: {
        ...result,
        message: 'Claim billing automation ran in safe preparation mode. Review required; no claims were submitted automatically.',
      },
    } satisfies ApiResponse);

  } catch (err) { next(err); }
});

router.get('/status', requireAuth, requirePracticeMembership(['owner','admin']), async (req: any, res: any, next: any) => {
  try {
    const settings = await prisma.practiceAISettings.findUnique({ where: { practiceId: req.practiceId! } });
    res.json({ success: true, data: {
      autoTaskReminders: settings?.autoTaskReminders ?? false,
      autoDoctorSetup: settings?.autoDoctorSetup ?? false,
      autoClaimBilling: settings?.autoClaimBilling ?? false,
      aiProvider: settings?.aiProvider ?? 'mock',
    }} satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
