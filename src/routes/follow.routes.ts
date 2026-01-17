import { NextFunction, Request, Response, Router } from "express";
import { and, eq } from "drizzle-orm";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../middleware/errorMiddleware";
import { db } from "../db/client";
import { followsTable } from "../db"; // renamed
import { z } from "zod";

export const followRouter = Router();

const followeeParamSchema = z.object({
  followeeId: z.coerce.number().int().positive(),
});

// Who I follow
followRouter.get(
  "/following",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new HttpError(401, "Missing token", null);

    const rows = await db
      .select({
        followeeId: followsTable.followeeId,
        createdAt: followsTable.createdAt,
      })
      .from(followsTable)
      .where(eq(followsTable.followerId, userId));

    return res.status(200).json({ data: rows });
  })
);

// Who follows me
followRouter.get(
  "/followers",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new HttpError(401, "Missing token", null);

    const rows = await db
      .select({
        followerId: followsTable.followerId,
        createdAt: followsTable.createdAt,
      })
      .from(followsTable)
      .where(eq(followsTable.followeeId, userId));

    return res.status(200).json({ data: rows });
  })
);

// Follow a user
followRouter.post(
  "/:followeeId",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new HttpError(401, "Missing token", null);

    const parsed = followeeParamSchema.safeParse(req.params);
    if (!parsed.success)
      throw new HttpError(400, "Bad request", parsed.error.flatten());

    const followeeId = parsed.data.followeeId;

    if (followeeId === userId) {
      throw new HttpError(400, "You cannot follow yourself", null);
    }

    // Avoid blowing up on duplicate follow: do nothing if exists
    const [row] = await db
      .insert(followsTable)
      .values({ followerId: userId, followeeId })
      // Drizzle supports onConflictDoNothing for pg:
      .onConflictDoNothing()
      .returning();

    // If it already existed, row will be undefined
    return res.status(201).json({
      data: row ?? { followerId: userId, followeeId, createdAt: null },
      meta: { created: !!row },
    });
  })
);

// Unfollow
followRouter.delete(
  "/:followeeId",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new HttpError(401, "Missing token", null);

    const parsed = followeeParamSchema.safeParse(req.params);
    if (!parsed.success)
      throw new HttpError(400, "Bad request", parsed.error.flatten());

    const followeeId = parsed.data.followeeId;

    const [deleted] = await db
      .delete(followsTable)
      .where(
        and(
          eq(followsTable.followerId, userId),
          eq(followsTable.followeeId, followeeId)
        )
      )
      .returning({
        followerId: followsTable.followerId,
        followeeId: followsTable.followeeId,
      });

    // 204 = no body. If you want to return deleted info, use 200.
    return res.status(200).json({ deleted });
  })
);
