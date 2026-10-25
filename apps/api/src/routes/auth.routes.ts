import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt';
import { Errors, AppError } from '../lib/errors';
import { requireAuth } from '../middleware/requireAuth';
import { audit } from '../lib/audit';
import { ApiResponse } from '@synapsemed/shared';

const router = Router();

// ── Register ──────────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  async (req: any, res: any, next: any) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) {
        const details: Record<string, string[]> = {};
        errs.array().forEach((e: any) => { const f = e.path ?? 'general'; details[f] = [...(details[f] ?? []), e.msg]; });
        throw Errors.VALIDATION(details);
      }
      const { email, password, firstName, lastName, phone } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw Errors.CONFLICT('Email is already registered');
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({ data: { email, passwordHash, firstName, lastName, phone } });
      await audit({ actorId: user.id, action: 'user.login', resourceType: 'User', resourceId: user.id, ipAddress: req.ip, metadata: { event: 'register' } });
      const accessToken = signAccessToken({ sub: user.id, email: user.email });
      const refreshToken = signRefreshToken(user.id);
      await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
      res.status(201).json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } } } satisfies ApiResponse);
    } catch (err) { next(err); }
  },
);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], async (req: any, res: any, next: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw Errors.INVALID_CREDENTIALS();
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) { await audit({ actorId: user.id, action: 'user.login', result: 'failure', ipAddress: req.ip }); throw Errors.INVALID_CREDENTIALS(); }
    if (user.status !== 'active') throw new AppError('Account is suspended', 403, 'ACCOUNT_INACTIVE');
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
    await audit({ actorId: user.id, action: 'user.login', ipAddress: req.ip });
    res.json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Refresh ───────────────────────────────────────────────────────────────────
router.post('/refresh', async (req: any, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw Errors.UNAUTHORIZED();
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw Errors.TOKEN_EXPIRED();
    const payload = verifyToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw Errors.UNAUTHORIZED();
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const newRefresh = signRefreshToken(user.id);
    await prisma.refreshToken.create({ data: { token: newRefresh, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await prisma.refreshToken.updateMany({ where: { token: refreshToken, userId: req.user!.sub }, data: { revokedAt: new Date() } });
    await audit({ actorId: req.user!.sub, action: 'user.logout', ipAddress: req.ip });
    res.json({ success: true, data: { message: 'Logged out' } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, emailVerified: true, status: true, createdAt: true },
    });
    if (!user) throw Errors.NOT_FOUND('User');
    res.json({ success: true, data: user } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
