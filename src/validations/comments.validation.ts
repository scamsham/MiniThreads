import z from "zod";

export const getCommentsParamsSchema = z.object({
  postId: z.uuidv4(),
});

// limit and cursor
export const getQuerySchema = z.object({
  limit: z.coerce.number().min(5).max(20).optional(),
  cursor: z.coerce.string().optional(),
});

export const postCommentSchema = z.object({
  postId: z.uuidv4(),
  comment: z.string().min(6).max(8192),
  parentCommentId: z.uuidv4().optional(),
});

export const updateCommentSchema = z.object({
  comment: z.string(),
});

export const updateCommentQuerySchema = z.object({
  commentId: z.uuid(),
});

export const deleteCommentParamsSchema = z.object({
  commentId: z.uuid(),
});
