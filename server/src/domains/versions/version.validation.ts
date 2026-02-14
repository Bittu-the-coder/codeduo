import { z } from 'zod';

export const createVersionSchema = z.object({
  message: z.string().max(500, 'Message too long').optional().default(''),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
});

export const versionIdSchema = z.object({
  versionId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid version ID'),
});

export const listVersionsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type ListVersionsInput = z.infer<typeof listVersionsSchema>;
