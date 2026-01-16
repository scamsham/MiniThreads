import z from "zod";

export const followUserSchema = z.object({
  followeeId: z.coerce.number(),
});

export const deleteFolloweeSchema = z.object({
  followeeId: z.coerce.number(),
});
