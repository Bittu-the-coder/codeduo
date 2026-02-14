import { Router } from 'express';
import {
  optionalAuth,
  requireAuth,
} from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as versionController from './version.controller.js';
import {
  createVersionSchema,
  listVersionsSchema,
  versionIdSchema,
} from './version.validation.js';

const router = Router({ mergeParams: true }); // Enable access to :id from parent router

// List versions
router.get(
  '/',
  optionalAuth,
  validate(listVersionsSchema, 'query'),
  asyncHandler(versionController.listVersions)
);

// Compare versions
router.get(
  '/compare',
  optionalAuth,
  asyncHandler(versionController.compareVersions)
);

// Create version
router.post(
  '/',
  requireAuth,
  validate(createVersionSchema),
  asyncHandler(versionController.createVersion)
);

// Get specific version
router.get(
  '/:versionId',
  optionalAuth,
  validate(versionIdSchema, 'params'),
  asyncHandler(versionController.getVersion)
);

// Restore version
router.post(
  '/:versionId/restore',
  requireAuth,
  validate(versionIdSchema, 'params'),
  asyncHandler(versionController.restoreVersion)
);

// Delete version
router.delete(
  '/:versionId',
  requireAuth,
  validate(versionIdSchema, 'params'),
  asyncHandler(versionController.deleteVersion)
);

export default router;
