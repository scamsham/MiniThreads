import z from "zod";

export const getPostsQuerySchema = z.object({
  limit: z.coerce.number().min(5).max(20).optional(),
  cursor: z.coerce.string().optional(),
});

export const getPostsParamsSchema = z.object({
  id: z.coerce.number(),
});

export const postPostsSchema = z.object({
  authorId: z.coerce.number(),
  content: z.string().min(6).max(16384),
  isEdited: z.boolean().optional(),
});
