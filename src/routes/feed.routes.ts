import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../middleware/errorMiddleware";
import { getFeedQuerySchema } from "../validations/feed.validation";
import { db } from "../db/client";
import { followersTable, postsTable } from "../db";
import { and, desc, eq, lt } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "../lib/encode-decode";

export const feedRouter = Router();

feedRouter.get(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      // create a feed with videos people share and public profile feed
      const userId = request.user?.userId;
      if (!userId) {
        throw new HttpError(401, "Invalid credentials", null);
      }
      const parsedQuery = getFeedQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new HttpError(400, "Bad request", null);
      }
      const { limit = 10, cursor } = parsedQuery.data;

      let whereClause = [];

      if (cursor) {
        const cursorDate = new Date(decodeCursor(cursor));
        whereClause.push(lt(postsTable.createdAt, cursorDate));
      }

      whereClause.push(eq(followersTable.followerId, userId));

      const feed = await db
        .select({
          id: postsTable.id,
          authorId: postsTable.authorId,
          authorUsername: postsTable.authorUsername,
          content: postsTable.content,
          isEdited: postsTable.isEdited,
          createdAt: postsTable.createdAt,
        })
        .from(postsTable)
        .innerJoin(
          followersTable,
          eq(postsTable.authorId, followersTable.followeeId)
        )
        .where(and(...whereClause))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit + 1);

      const hasNext = feed.length > limit;
      const userFeed = hasNext ? feed.slice(0, limit) : feed;
      const nextCursor = hasNext
        ? encodeCursor(userFeed[userFeed.length - 1].createdAt)
        : null;

      return response.status(200).json({
        feed: userFeed,
        cursor: nextCursor,
      });
    }
  )
);
