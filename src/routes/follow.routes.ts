import { Router } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { followsTable, usersTable } from "../db";
import { redis } from "../infra/redis/client";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../middleware/errorMiddleware";

export const followRouter = Router();

const followeeParamSchema = z.object({
  followeeId: z.coerce.number().int().positive(),
});

// Follow request (privacy-aware)
followRouter.post(
  "/:followeeId",
  asyncHandler(async (req, res) => {
    const viewerId = req.user?.userId;
    if (!viewerId) throw new HttpError(401, "Missing token", null);

    const parsed = followeeParamSchema.safeParse(req.params);
    if (!parsed.success)
      throw new HttpError(400, "Bad request", parsed.error.flatten());

    const followeeId = parsed.data.followeeId;
    if (followeeId === viewerId)
      throw new HttpError(400, "You cannot follow yourself", null);

    const [followee] = await db
      .select({ isPrivate: usersTable.isPrivate })
      .from(usersTable)
      .where(eq(usersTable.id, followeeId))
      .limit(1);

    if (!followee) throw new HttpError(404, "User not found", null);

    const status = followee.isPrivate ? "pending" : "accepted";

    await db
      .insert(followsTable)
      .values({ followerId: viewerId, followeeId, status })
      .onConflictDoNothing();

    // Invalidate cached relationship signal
    await redis.del(`follow:${viewerId}:${followeeId}`);

    return res.status(201).json({
      data: { followerId: viewerId, followeeId, status },
    });
  })
);

// Accept a follow request (only followee can accept)
followRouter.post(
  "/requests/:followerId/accept",
  asyncHandler(async (req, res) => {
    const followeeId = req.user?.userId;
    if (!followeeId) throw new HttpError(401, "Missing token", null);

    const followerId = z.coerce
      .number()
      .int()
      .positive()
      .parse(req.params.followerId);

    const [updated] = await db
      .update(followsTable)
      .set({ status: "accepted" })
      .where(
        and(
          eq(followsTable.followerId, followerId),
          eq(followsTable.followeeId, followeeId),
          eq(followsTable.status, "pending")
        )
      )
      .returning();

    if (!updated) throw new HttpError(404, "No pending request found", null);

    // Invalidate relationship cache
    await redis.del(`follow:${followerId}:${followeeId}`);

    return res.status(200).json({ data: updated });
  })
);

// Unfollow (or cancel request)
followRouter.delete(
  "/:followeeId",
  asyncHandler(async (req, res) => {
    const viewerId = req.user?.userId;
    if (!viewerId) throw new HttpError(401, "Missing token", null);

    const parsed = followeeParamSchema.safeParse(req.params);
    if (!parsed.success)
      throw new HttpError(400, "Bad request", parsed.error.flatten());

    const followeeId = parsed.data.followeeId;

    await db
      .delete(followsTable)
      .where(
        and(
          eq(followsTable.followerId, viewerId),
          eq(followsTable.followeeId, followeeId)
        )
      );

    await redis.del(`follow:${viewerId}:${followeeId}`);

    return res.status(204).send();
  })
);
