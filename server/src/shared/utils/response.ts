import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response {
  const errorObj: { code: string; message: string; details?: unknown } = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  const response: ApiResponse = {
    success: false,
    error: errorObj,
  };

  return res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  page: number,
  perPage: number,
  total: number
): Response {
  return successResponse(res, data, 200, {
    page,
    perPage,
    total,
    hasMore: page * perPage < total,
  });
}

export function createdResponse<T>(res: Response, data: T): Response {
  return successResponse(res, data, 201);
}

export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}
