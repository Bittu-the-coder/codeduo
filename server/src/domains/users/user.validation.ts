import { z } from 'zod';

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
  settings: z
    .object({
      theme: z.enum(['dark', 'light']).optional(),
      editorFontSize: z.number().min(10).max(32).optional(),
      keybindings: z.enum(['default', 'vim', 'emacs']).optional(),
    })
    .optional(),
});

export const userIdSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1).max(100),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
