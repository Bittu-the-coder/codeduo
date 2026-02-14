import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { getValidatedQuery } from '../../shared/middleware/validation.middleware.js';
import {
  createdResponse,
  noContentResponse,
  paginatedResponse,
  successResponse,
} from '../../shared/utils/response.js';
import { projectService } from './project.service.js';
import type { ListProjectsInput } from './project.validation.js';

// Helper to get string param (Express 5 can return string | string[])
function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * GET /api/projects
 */
export async function listProjects(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const query = getValidatedQuery<ListProjectsInput>(req);
  const result = await projectService.listUserProjects(
    authReq.user.userId,
    query
  );

  paginatedResponse(
    res,
    result.projects,
    result.page,
    result.perPage,
    result.total
  );
}

/**
 * GET /api/projects/public
 */
export async function listPublicProjects(
  req: Request,
  res: Response
): Promise<void> {
  const query = getValidatedQuery<ListProjectsInput>(req);
  const result = await projectService.listPublicProjects(query);

  paginatedResponse(
    res,
    result.projects,
    result.page,
    result.perPage,
    result.total
  );
}

/**
 * POST /api/projects
 */
export async function createProject(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const project = await projectService.create(authReq.user.userId, req.body);

  createdResponse(res, project);
}

/**
 * GET /api/projects/:id
 */
export async function getProject(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.userId || null;
  const projectId = getStringParam(req.params.id);
  const project = await projectService.getById(projectId, userId, true);

  successResponse(res, project);
}

/**
 * PATCH /api/projects/:id
 */
export async function updateProject(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const project = await projectService.update(
    projectId,
    authReq.user.userId,
    req.body
  );

  successResponse(res, project);
}

/**
 * DELETE /api/projects/:id
 */
export async function deleteProject(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  await projectService.delete(projectId, authReq.user.userId);

  noContentResponse(res);
}

/**
 * POST /api/projects/:id/fork
 */
export async function forkProject(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const project = await projectService.fork(
    projectId,
    authReq.user.userId,
    req.body
  );

  createdResponse(res, project);
}

/**
 * GET /api/projects/:id/collaborators
 */
export async function getCollaborators(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const collaborators = await projectService.getCollaborators(
    projectId,
    authReq.user.userId
  );

  successResponse(res, collaborators);
}

/**
 * POST /api/projects/:id/collaborators
 */
export async function addCollaborator(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  await projectService.addCollaborator(
    projectId,
    authReq.user.userId,
    req.body
  );

  createdResponse(res, { message: 'Collaborator added successfully' });
}

/**
 * DELETE /api/projects/:id/collaborators/:userId
 */
export async function removeCollaborator(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const targetUserId = getStringParam(req.params.userId);
  await projectService.removeCollaborator(
    projectId,
    authReq.user.userId,
    targetUserId
  );

  noContentResponse(res);
}

/**
 * PUT /api/projects/:id/files
 */
export async function updateFileTree(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const project = await projectService.updateFileTree(
    projectId,
    authReq.user.userId,
    req.body.fileTree
  );

  successResponse(res, project);
}
