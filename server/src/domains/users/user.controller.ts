import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { getValidatedQuery } from '../../shared/middleware/validation.middleware.js';
import {
  noContentResponse,
  paginatedResponse,
  successResponse,
} from '../../shared/utils/response.js';
import { userService } from './user.service.js';
import type { SearchUsersInput } from './user.validation.js';

// Helper to get string param (Express 5 can return string | string[])
function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * GET /api/users/search
 */
export async function searchUsers(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery<SearchUsersInput>(req);
  const result = await userService.searchUsers(query);
  paginatedResponse(
    res,
    result.users,
    result.page,
    result.perPage,
    result.total
  );
}

/**
 * GET /api/users/me
 */
export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const user = await userService.getUserById(authReq.user.userId);
  successResponse(res, user);
}

/**
 * GET /api/users/:userId
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  const userId = getStringParam(req.params.userId);
  const user = await userService.getUserById(userId);
  successResponse(res, user);
}

/**
 * GET /api/users/username/:username
 */
export async function getUserByUsername(
  req: Request,
  res: Response
): Promise<void> {
  const username = getStringParam(req.params.username);
  const profile = await userService.getPublicProfile(username);
  successResponse(res, profile);
}

/**
 * PATCH /api/users/me
 */
export async function updateCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const user = await userService.updateUser(authReq.user.userId, req.body);
  successResponse(res, user);
}

/**
 * DELETE /api/users/me
 */
export async function deleteCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  await userService.deleteUser(authReq.user.userId);
  noContentResponse(res);
}
