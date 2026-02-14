import { Router } from 'express';
import {
  optionalAuth,
  requireAuth,
} from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as fileController from './file.controller.js';
import { createFileSchema, moveFileSchema } from './file.validation.js';

const router = Router({ mergeParams: true }); // Enable access to :id from parent router

// Helper to get string param (Express 5 can return string | string[])
function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// Get file content (supports nested paths)
router.get('/{*filePath}', optionalAuth, asyncHandler(fileController.getFile));

// Create file/folder
router.post(
  '/',
  requireAuth,
  validate(createFileSchema),
  asyncHandler(fileController.createFile)
);

// Update file content
router.patch(
  '/{*filePath}',
  requireAuth,
  asyncHandler(async (req, res, next) => {
    // Skip if path ends with /move
    const filePath = getStringParam(req.params.filePath);
    if (filePath.endsWith('/move')) {
      return next('route');
    }
    return fileController.updateFile(req, res);
  })
);

// Move/rename file
router.post(
  '/{*filePath}/move',
  requireAuth,
  validate(moveFileSchema),
  asyncHandler(fileController.moveFile)
);

// Delete file
router.delete(
  '/{*filePath}',
  requireAuth,
  asyncHandler(fileController.deleteFile)
);

export default router;
