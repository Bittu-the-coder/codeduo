import { Router } from 'express';
import {
  optionalAuth,
  requireAuth,
} from '../../shared/middleware/auth.middleware.js';
import { createProjectRateLimit } from '../../shared/middleware/rateLimit.middleware.js';
import {
  validate,
  validateRequest,
} from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as projectController from './project.controller.js';
import {
  addCollaboratorSchema,
  createProjectSchema,
  forkProjectSchema,
  listProjectsSchema,
  projectIdSchema,
  updateProjectSchema,
} from './project.validation.js';

const router = Router();

// Public routes
router.get(
  '/public',
  validate(listProjectsSchema, 'query'),
  asyncHandler(projectController.listPublicProjects)
);

// Protected routes
router.get(
  '/',
  requireAuth,
  validate(listProjectsSchema, 'query'),
  asyncHandler(projectController.listProjects)
);

router.post(
  '/',
  requireAuth,
  createProjectRateLimit,
  validate(createProjectSchema),
  asyncHandler(projectController.createProject)
);

router.get(
  '/:id',
  optionalAuth,
  validate(projectIdSchema, 'params'),
  asyncHandler(projectController.getProject)
);

router.patch(
  '/:id',
  requireAuth,
  validateRequest({
    params: projectIdSchema,
    body: updateProjectSchema,
  }),
  asyncHandler(projectController.updateProject)
);

router.delete(
  '/:id',
  requireAuth,
  validate(projectIdSchema, 'params'),
  asyncHandler(projectController.deleteProject)
);

router.post(
  '/:id/fork',
  requireAuth,
  validateRequest({
    params: projectIdSchema,
    body: forkProjectSchema,
  }),
  asyncHandler(projectController.forkProject)
);

// File tree update
router.put(
  '/:id/files',
  requireAuth,
  validate(projectIdSchema, 'params'),
  asyncHandler(projectController.updateFileTree)
);

// Collaborators
router.get(
  '/:id/collaborators',
  requireAuth,
  validate(projectIdSchema, 'params'),
  asyncHandler(projectController.getCollaborators)
);

router.post(
  '/:id/collaborators',
  requireAuth,
  validateRequest({
    params: projectIdSchema,
    body: addCollaboratorSchema,
  }),
  asyncHandler(projectController.addCollaborator)
);

router.delete(
  '/:id/collaborators/:userId',
  requireAuth,
  validate(projectIdSchema, 'params'),
  asyncHandler(projectController.removeCollaborator)
);

export default router;
