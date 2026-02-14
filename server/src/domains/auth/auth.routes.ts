import { Router } from 'express';
import {
  checkTokenBlacklist,
  requireAuth,
} from '../../shared/middleware/auth.middleware.js';
import { authRateLimit } from '../../shared/middleware/rateLimit.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as authController from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from './auth.validation.js';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post('/logout', asyncHandler(authController.logout));

router.post('/refresh', asyncHandler(authController.refreshToken));

// OAuth routes
router.get('/github', authController.githubOAuthRedirect);
router.get(
  '/github/callback',
  asyncHandler(authController.githubOAuthCallback)
);

// Protected routes
router.get(
  '/me',
  requireAuth,
  checkTokenBlacklist,
  asyncHandler(authController.getCurrentUser)
);

router.put(
  '/password',
  requireAuth,
  checkTokenBlacklist,
  validate(updatePasswordSchema),
  asyncHandler(authController.updatePassword)
);

export default router;
