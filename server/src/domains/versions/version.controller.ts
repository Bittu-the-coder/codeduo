import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { getValidatedQuery } from '../../shared/middleware/validation.middleware.js';
import {
  createdResponse,
  noContentResponse,
  paginatedResponse,
  successResponse,
} from '../../shared/utils/response.js';
import { versionService } from './version.service.js';
import type { ListVersionsInput } from './version.validation.js';

// Helper to get string param (Express 5 can return string | string[])
function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * GET /api/projects/:id/versions
 */
export async function listVersions(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.userId || null;
  const projectId = getStringParam(req.params.id);
  const query = getValidatedQuery<ListVersionsInput>(req);

  const result = await versionService.listVersions(projectId, userId, query);

  paginatedResponse(
    res,
    result.versions,
    result.page,
    result.perPage,
    result.total
  );
}

/**
 * POST /api/projects/:id/versions
 */
export async function createVersion(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const version = await versionService.createVersion(
    projectId,
    authReq.user.userId,
    req.body
  );

  createdResponse(res, version);
}

/**
 * GET /api/projects/:id/versions/:versionId
 */
export async function getVersion(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.userId || null;
  const projectId = getStringParam(req.params.id);
  const versionId = getStringParam(req.params.versionId);

  const version = await versionService.getVersion(projectId, versionId, userId);

  successResponse(res, version);
}

/**
 * POST /api/projects/:id/versions/:versionId/restore
 */
export async function restoreVersion(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const versionId = getStringParam(req.params.versionId);

  await versionService.restoreVersion(
    projectId,
    versionId,
    authReq.user.userId
  );

  successResponse(res, { message: 'Version restored successfully' });
}

/**
 * DELETE /api/projects/:id/versions/:versionId
 */
export async function deleteVersion(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const projectId = getStringParam(req.params.id);
  const versionId = getStringParam(req.params.versionId);

  await versionService.deleteVersion(projectId, versionId, authReq.user.userId);

  noContentResponse(res);
}

/**
 * GET /api/projects/:id/versions/compare?v1=xxx&v2=yyy
 */
export async function compareVersions(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.userId || null;
  const projectId = getStringParam(req.params.id);
  const v1 = getStringParam(req.query.v1 as string | string[] | undefined);
  const v2 = getStringParam(req.query.v2 as string | string[] | undefined);

  if (!v1 || !v2) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Both v1 and v2 query parameters are required',
      },
    });
    return;
  }

  const diff = await versionService.compareVersions(projectId, v1, v2, userId);

  successResponse(res, diff);
}
