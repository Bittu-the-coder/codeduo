import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import {
  createdResponse,
  noContentResponse,
  successResponse,
} from '../../shared/utils/response.js';
import { fileService } from './file.service.js';

// Helper to get string param (Express 5 can return string | string[])
function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * GET /api/projects/:id/files/:filePath
 */
export async function getFile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.userId || null;
  const projectId = getStringParam(req.params.id);
  const filePath = getStringParam(req.params.filePath || req.params.path);

  const file = await fileService.getFile(projectId, userId, filePath);

  if (!file) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'File not found' },
    });
    return;
  }

  successResponse(res, file);
}

/**
 * POST /api/projects/:id/files
 */
export async function createFile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const file = await fileService.createFile(
    projectId,
    authReq.user.userId,
    req.body
  );

  createdResponse(res, file);
}

/**
 * PATCH /api/projects/:id/files/:filePath
 */
export async function updateFile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const filePath = getStringParam(req.params.filePath || req.params.path);

  const file = await fileService.updateFile(
    projectId,
    authReq.user.userId,
    filePath,
    req.body
  );

  successResponse(res, file);
}

/**
 * DELETE /api/projects/:id/files/:filePath
 */
export async function deleteFile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const filePath = getStringParam(req.params.filePath || req.params.path);

  await fileService.deleteFile(projectId, authReq.user.userId, filePath);

  noContentResponse(res);
}

/**
 * POST /api/projects/:id/files/:filePath/move
 */
export async function moveFile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const filePath = getStringParam(req.params.filePath || req.params.path);

  const file = await fileService.moveFile(
    projectId,
    authReq.user.userId,
    filePath,
    req.body
  );

  successResponse(res, file);
}
