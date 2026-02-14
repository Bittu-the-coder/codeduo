import { z } from 'zod';

const pathValidation = z
  .string()
  .min(1, 'Path is required')
  .max(1000, 'Path too long')
  .regex(/^[a-zA-Z0-9/_.-]+$/, 'Invalid characters in path')
  .refine((path: string) => !path.includes('..'), 'Path traversal not allowed');

export const createFileSchema = z.object({
  path: pathValidation,
  type: z.enum(['file', 'folder']),
  content: z
    .string()
    .max(10_000_000, 'File too large (max 10MB)')
    .optional()
    .default(''),
  language: z.string().max(50).optional(),
});

export const updateFileSchema = z.object({
  content: z.string().max(10_000_000, 'File too large (max 10MB)'),
});

export const moveFileSchema = z.object({
  newPath: pathValidation,
});

export const filePathSchema = z.object({
  path: pathValidation,
});

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type MoveFileInput = z.infer<typeof moveFileSchema>;
