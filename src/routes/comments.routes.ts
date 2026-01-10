import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import {
  getCommentsParamsSchema,
  getQuerySchema,
  postCommentSchema,
} from "../validations/comments.validation";
import { HttpError } from "../middleware/errorMiddleware";
import { decodeCursor, encodeCursor } from "../lib/encode-decode";
import { and, desc, eq } from "drizzle-orm";
import { commentsTable, postsTable } from "../db";
import { lt } from "drizzle-orm";
import { db } from "../db/client";

export const commentsRouter = Router();

commentsRouter.get(
  "/:postId",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const parsedParams = getCommentsParamsSchema.safeParse(request.params);
      const parsedQuery = getQuerySchema.safeParse(request.query);
      if (!parsedParams.success || !parsedQuery.success) {
        throw new HttpError(400, "Bad request", null);
      }
      const { postId } = parsedParams.data;
      const { limit = 10, cursor } = parsedQuery.data;

      let whereClause = [];

      if (cursor) {
        const cursorCreateDate = new Date(decodeCursor(cursor));
        whereClause.push(lt(commentsTable.createdAt, cursorCreateDate));
      }

      whereClause.push(eq(postsTable.id, postId));

      const comments = await db
        .select({
          id: commentsTable.id,
          postId: commentsTable.postId,
          authorId: commentsTable.authorId,
          parentCommentId: commentsTable.parentCommentId,
          comment: commentsTable.comment,
          createdAt: commentsTable.createdAt,
        })
        .from(commentsTable)
        .innerJoin(postsTable, eq(postsTable.id, commentsTable.postId))
        .where(and(...whereClause))
        .orderBy(desc(commentsTable.createdAt))
        .limit(limit + 1);

      const hasNext = comments.length > limit;
      const commentsOnPost = hasNext ? comments.slice(0, limit) : comments;
      const lastComment = commentsOnPost[commentsOnPost.length - 1];
      const nextCursor = encodeCursor(lastComment.createdAt);

      return response.status(200).json({
        comments: commentsOnPost,
        cursor: nextCursor,
      });
    }
  )
);

commentsRouter.post(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      // look for both parent post and parent comment
      if (!request.user?.userId) {
        throw new HttpError(401, "Invalid credentials", null);
      }

      const authorId = request.user?.userId;

      const parsed = postCommentSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new HttpError(400, "Bad request", {});
      }
      const { postId, comment, parentCommentId = null } = parsed.data;

      const [newComment] = await db
        .insert(commentsTable)
        .values({
          postId: postId,
          authorId: authorId,
          comment: comment,
          parentCommentId: parentCommentId,
        })
        .returning();

      response.status(200).json({
        comment: newComment,
      });
    }
  )
);
