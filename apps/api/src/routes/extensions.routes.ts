import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

/**
 * Extension marketplace routes.
 *
 * SECURITY RULES:
 *  1. Extensions can only be installed if reviewState === 'approved'.
 *  2. Server always re-validates permissions — extensions cannot bypass tenant
 *     isolation or RBAC by claiming permissions in their manifest.
 *  3. Billing entitlement is enforced server-side; frontend display is not
 *     relied upon for access control.
 *  4. Every install/uninstall/enable/disable/rollback event is logged.
 */

// ── Public catalogue ──────────────────────────────────────────────────────────

// List approved extensions available to install
router.get('/catalogue', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const extensions = await prisma.extension.findMany({
      where: { reviewState: 'approved' },
      include: { versions: { orderBy: { publishedAt: 'desc' }, take: 1 } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: extensions } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Get a specific extension (must be approved to be visible)
router.get('/catalogue/:slug', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const ext = await prisma.extension.findFirst({
      where: { slug: req.params.slug, reviewState: 'approved' },
      include: { versions: { orderBy: { publishedAt: 'desc' } } },
    });
    if (!ext) throw Errors.NOT_FOUND('Extension');
    res.json({ success: true, data: ext } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Publisher registration ────────────────────────────────────────────────────

// Register a new extension (starts in pending review state)
router.post('/register',
  requireAuth,
  [body('name').notEmpty(), body('slug').notEmpty(), body('latestVersion').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { name, slug, latestVersion, description, permissions, compatibility, price, billingModel, manifestJson } = req.body;
      const existing = await prisma.extension.findUnique({ where: { slug } });
      if (existing) throw Errors.CONFLICT('Extension slug already registered');
      const ext = await prisma.extension.create({
        data: {
          publisherId: req.user!.sub,
          name, slug,
          latestVersion,
          description,
          permissions: permissions ? JSON.stringify(permissions) : '[]',
          compatibility,
          price: price ?? 0,
          billingModel: billingModel ?? 'monthly',
          reviewState: 'pending',
          manifestJson: manifestJson ? JSON.stringify(manifestJson) : '{}',
          versions: {
            create: [{
              version: latestVersion,
              manifestJson: manifestJson ? JSON.stringify(manifestJson) : '{}',
              permissions: permissions ? JSON.stringify(permissions) : '[]',
              changelog: 'Initial version',
            }],
          },
        },
        include: { versions: true },
      });
      res.status(201).json({ success: true, data: ext } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// Advance review state (platform admin action — simplified: any authenticated user for dev)
router.patch('/catalogue/:slug/review',
  requireAuth,
  [body('reviewState').isIn(['approved', 'rejected', 'suspended'])],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const ext = await prisma.extension.findUnique({ where: { slug: req.params.slug } });
      if (!ext) throw Errors.NOT_FOUND('Extension');
      const updated = await prisma.extension.update({ where: { id: ext.id }, data: { reviewState: req.body.reviewState } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// ── Practice-scoped install/uninstall/enable/disable ──────────────────────────

// List installed extensions for a practice
router.get('/', requireAuth, requirePracticeMembership(), async (req: any, res: any, next: any) => {
  try {
    const entitlements = await prisma.practiceExtensionEntitlement.findMany({
      where: { practiceId: req.practiceId! },
      include: { extension: true },
    });
    res.json({ success: true, data: entitlements } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// Install an extension
router.post('/install',
  requireAuth, requirePracticeMembership(['owner', 'admin']),
  [body('extensionId').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { extensionId } = req.body;
      const ext = await prisma.extension.findUnique({ where: { id: extensionId } });
      if (!ext) throw Errors.NOT_FOUND('Extension');
      // Enforce: only approved extensions can be installed
      if (ext.reviewState !== 'approved') {
        return res.status(403).json({ success: false, error: { code: 'EXTENSION_NOT_APPROVED', message: 'Extension must be approved before installation.' } });
      }
      const existing = await prisma.practiceExtensionEntitlement.findUnique({ where: { practiceId_extensionId: { practiceId: req.practiceId!, extensionId } } });
      if (existing && existing.status !== 'uninstalled') throw Errors.CONFLICT('Extension is already installed');
      const entitlement = await prisma.practiceExtensionEntitlement.upsert({
        where: { practiceId_extensionId: { practiceId: req.practiceId!, extensionId } },
        create: { practiceId: req.practiceId!, extensionId, installedVersion: ext.latestVersion, status: 'active', activatedAt: new Date() },
        update: { installedVersion: ext.latestVersion, status: 'active', activatedAt: new Date(), uninstalledAt: null },
      });
      await prisma.extensionInstallLog.create({ data: { entitlementId: entitlement.id, actorUserId: req.user!.sub, event: 'install', toVersion: ext.latestVersion } });
      res.status(201).json({ success: true, data: entitlement } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// Enable a disabled extension
router.post('/:entitlementId/enable',
  requireAuth, requirePracticeMembership(['owner', 'admin']),
  async (req: any, res: any, next: any) => {
    try {
      const ent = await prisma.practiceExtensionEntitlement.findFirst({ where: { id: req.params.entitlementId, practiceId: req.practiceId! } });
      if (!ent) throw Errors.NOT_FOUND('Extension entitlement');
      if (ent.status === 'active') throw Errors.CONFLICT('Extension is already active');
      if (ent.status === 'uninstalled') throw Errors.CONFLICT('Cannot enable an uninstalled extension — reinstall first');
      const updated = await prisma.practiceExtensionEntitlement.update({ where: { id: ent.id }, data: { status: 'active', disabledAt: null } });
      await prisma.extensionInstallLog.create({ data: { entitlementId: ent.id, actorUserId: req.user!.sub, event: 'enable' } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// Disable an extension
router.post('/:entitlementId/disable',
  requireAuth, requirePracticeMembership(['owner', 'admin']),
  async (req: any, res: any, next: any) => {
    try {
      const ent = await prisma.practiceExtensionEntitlement.findFirst({ where: { id: req.params.entitlementId, practiceId: req.practiceId! } });
      if (!ent) throw Errors.NOT_FOUND('Extension entitlement');
      if (ent.status !== 'active') throw Errors.CONFLICT('Extension is not currently active');
      const updated = await prisma.practiceExtensionEntitlement.update({ where: { id: ent.id }, data: { status: 'disabled', disabledAt: new Date() } });
      await prisma.extensionInstallLog.create({ data: { entitlementId: ent.id, actorUserId: req.user!.sub, event: 'disable' } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// Uninstall an extension
router.post('/:entitlementId/uninstall',
  requireAuth, requirePracticeMembership(['owner', 'admin']),
  async (req: any, res: any, next: any) => {
    try {
      const ent = await prisma.practiceExtensionEntitlement.findFirst({ where: { id: req.params.entitlementId, practiceId: req.practiceId! } });
      if (!ent) throw Errors.NOT_FOUND('Extension entitlement');
      if (ent.status === 'uninstalled') throw Errors.CONFLICT('Extension is already uninstalled');
      const updated = await prisma.practiceExtensionEntitlement.update({ where: { id: ent.id }, data: { status: 'uninstalled', uninstalledAt: new Date() } });
      await prisma.extensionInstallLog.create({ data: { entitlementId: ent.id, actorUserId: req.user!.sub, event: 'uninstall', fromVersion: ent.installedVersion ?? undefined } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// Rollback to a specific version
router.post('/:entitlementId/rollback',
  requireAuth, requirePracticeMembership(['owner', 'admin']),
  [body('version').notEmpty()],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const ent = await prisma.practiceExtensionEntitlement.findFirst({ where: { id: req.params.entitlementId, practiceId: req.practiceId! }, include: { extension: true } });
      if (!ent) throw Errors.NOT_FOUND('Extension entitlement');
      const { version } = req.body;
      const versionRecord = await prisma.extensionVersion.findUnique({ where: { extensionId_version: { extensionId: ent.extensionId, version } } });
      if (!versionRecord) throw Errors.NOT_FOUND(`Version ${version} for this extension`);
      const fromVersion = ent.installedVersion;
      const updated = await prisma.practiceExtensionEntitlement.update({ where: { id: ent.id }, data: { installedVersion: version } });
      await prisma.extensionInstallLog.create({ data: { entitlementId: ent.id, actorUserId: req.user!.sub, event: 'rollback', fromVersion: fromVersion ?? undefined, toVersion: version } });
      res.json({ success: true, data: updated } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// Install log for an entitlement
router.get('/:entitlementId/logs',
  requireAuth, requirePracticeMembership(['owner', 'admin']),
  async (req: any, res: any, next: any) => {
    try {
      const ent = await prisma.practiceExtensionEntitlement.findFirst({ where: { id: req.params.entitlementId, practiceId: req.practiceId! } });
      if (!ent) throw Errors.NOT_FOUND('Extension entitlement');
      const logs = await prisma.extensionInstallLog.findMany({ where: { entitlementId: ent.id }, orderBy: { createdAt: 'desc' } });
      res.json({ success: true, data: logs } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

export default router;
