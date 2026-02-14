import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as userController from './user.controller.js';
import {
  searchUsersSchema,
  updateUserSchema,
  userIdSchema,
} from './user.validation.js';

const router = Router();

// Get current user (must be before /:userId to avoid param matching)
router.get('/me', requireAuth, asyncHandler(userController.getCurrentUser));

// Search users
router.get(
  '/search',
  validate(searchUsersSchema, 'query'),
  asyncHandler(userController.searchUsers)
);

// Update current user
router.patch(
  '/me',
  requireAuth,
  validate(updateUserSchema),
  asyncHandler(userController.updateCurrentUser)
);

// Delete current user
router.delete(
  '/me',
  requireAuth,
  asyncHandler(userController.deleteCurrentUser)
);

// Get user by ID
router.get(
  '/:userId',
  validate(userIdSchema, 'params'),
  asyncHandler(userController.getUserById)
);

// Get user by username
router.get(
  '/username/:username',
  asyncHandler(userController.getUserByUsername)
);

export default router;
