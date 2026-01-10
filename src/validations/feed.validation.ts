import z from "zod";

export const getFeedQuerySchema = z.object({
  limit: z.coerce.number().min(5).max(20).optional(),
  cursor: z.coerce.string().optional(),
});
