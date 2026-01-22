import { Router } from "express";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "../db/client";
import { followsTable, postsTable, usersTable } from "../db";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../middleware/errorMiddleware";
import { decodeCursor, encodeCursor } from "../lib/encode-decode";
import { getFeedQuerySchema } from "../validations/feed.validation";
import { cacheGetOrSetJson } from "../infra/redis/cache";

export const feedRouter = Router();

feedRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new HttpError(401, "Invalid credentials", null);

    const parsed = getFeedQuerySchema.safeParse(req.query);
    if (!parsed.success)
      throw new HttpError(400, "Bad request", parsed.error.flatten());

    const { limit = 10, cursor } = parsed.data;
    const cursorKey = cursor ? cursor : "c0";
    const cacheKey = `feed:${userId}:l${limit}:${cursorKey}`;

    const { value: payload, hit } = await cacheGetOrSetJson(
      cacheKey,
      15,
      async () => {
        const whereClauses = [
          eq(followsTable.followerId, userId),
          eq(followsTable.status, "accepted"),
        ];

        if (cursor) {
          const cursorDate = new Date(decodeCursor(cursor));
          whereClauses.push(lt(postsTable.createdAt, cursorDate));
        }

        const rows = await db
          .select({
            id: postsTable.id,
            authorId: postsTable.authorId,
            authorUsername: usersTable.username,
            content: postsTable.content,
            isEdited: postsTable.isEdited,
            createdAt: postsTable.createdAt,
          })
          .from(postsTable)
          .innerJoin(
            followsTable,
            eq(postsTable.authorId, followsTable.followeeId)
          )
          .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
          .where(and(...whereClauses))
          .orderBy(desc(postsTable.createdAt), desc(postsTable.id))
          .limit(limit + 1);

        const hasNext = rows.length > limit;
        const feed = hasNext ? rows.slice(0, limit) : rows;
        const last = feed[feed.length - 1];
        const nextCursor =
          hasNext && last ? encodeCursor(last.createdAt) : null;

        return { feed, cursor: nextCursor };
      }
    );

    // Check in console hit/miss to see if caching is working
    // console.log({ cache: hit ? "hit" : "miss", key: cacheKey });

    return res.status(200).json({
      data: payload.feed,
      meta: { cursor: payload.cursor, cache: hit ? "hit" : "miss" },
    });
  })
);
