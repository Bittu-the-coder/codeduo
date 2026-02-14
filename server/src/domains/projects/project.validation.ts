import { z } from 'zod';

// File node schema for validation
const fileNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(['file', 'folder']),
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    path: z
      .string()
      .min(1, 'Path is required')
      .max(1000, 'Path too long')
      .refine(
        (path: string) => !path.includes('..'),
        'Path traversal not allowed'
      ),
    content: z.string().max(10_000_000, 'File too large (max 10MB)').optional(),
    language: z.string().max(50).optional(),
    children: z.array(fileNodeSchema).optional(),
  })
);

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional()
    .default(''),
  visibility: z
    .enum(['private', 'public', 'unlisted'])
    .optional()
    .default('public'),
  language: z.string().max(50).optional().default('cpp'),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  template: z
    .enum(['cpp', 'python', 'javascript', 'java', 'typescript', 'empty'])
    .optional()
    .default('cpp'),
});

export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  visibility: z.enum(['private', 'public', 'unlisted']).optional(),
  language: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  fileTree: z.array(fileNodeSchema).optional(),
});

export const projectIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
});

export const listProjectsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  visibility: z
    .enum(['private', 'public', 'unlisted', 'all'])
    .optional()
    .default('all'),
  language: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'viewCount'])
    .optional()
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const addCollaboratorSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
  role: z.enum(['editor', 'viewer']).optional().default('viewer'),
});

export const forkProjectSchema = z.object({
  title: z.string().max(100).optional(),
  visibility: z.enum(['private', 'public', 'unlisted']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type ForkProjectInput = z.infer<typeof forkProjectSchema>;
