import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../middleware/errorMiddleware";
import {
  getPostsParamsSchema,
  getPostsQuerySchema,
  postPostsSchema,
} from "../validations/posts.validation";
import { db } from "../db/client";
import { postsTable } from "../db";
import { and, desc, eq } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "../lib/encode-decode";
import { lt } from "drizzle-orm";

export const postsRouter = Router();

// Get posts of a particular user
postsRouter.get(
  "/:id",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      /* 
        1. Check if user is authenticated using userId in request.
        2. Look for user id in request params since user can check anyone's profile
        3. Look for limit and cursor in the request query.
        4. Return the posts by that user for public profile or if follows
      */
      if (!request.user?.userId) {
        throw new HttpError(401, "Invalid credentials", null);
      }

      const parsedParams = getPostsParamsSchema.safeParse(request.params);
      const parsedQuery = getPostsQuerySchema.safeParse(request.query);

      if (!parsedQuery.success || !parsedParams.success) {
        throw new HttpError(400, "Bad request", null);
      }
      // Params
      const { id: profileId } = parsedParams.data;
      // query
      const { limit = 10, cursor } = parsedQuery.data;

      let whereClauses = [];

      // Note: Since id is a type uuid, i decided not to
      // use it for ordering and keep the cursor clean
      // Cursor -> createdAt
      if (cursor) {
        const postCreatedAt = new Date(decodeCursor(cursor));
        whereClauses.push(lt(postsTable.createdAt, postCreatedAt));
      }

      whereClauses.push(eq(postsTable.authorId, profileId));
      // TBD : Check the follower-followee table
      const posts = await db
        .select()
        .from(postsTable)
        .where(and(...whereClauses))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit + 1);

      const hasNext = posts.length > limit;
      const userPosts = hasNext ? posts.slice(0, limit) : posts;
      const lastPost = userPosts[userPosts.length - 1];
      const nextCursor = hasNext ? encodeCursor(lastPost?.createdAt) : null;

      return response.status(200).json({
        posts: userPosts,
        cursor: nextCursor,
      });
    }
  )
);

// Adds a post for a particular user
postsRouter.post(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      // No request params since user can only upload his post
      if (!request.user?.userId) {
        throw new HttpError(401, "Invalid credentials", null);
      }

      const parsed = postPostsSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new HttpError(400, "Bad request", null);
      }

      const { authorId, content, isEdited = false } = parsed.data;

      const [newPost] = await db
        .insert(postsTable)
        .values({
          authorId,
          content,
          isEdited,
        })
        .returning();

      return response.status(201).json({
        post: newPost,
      });
    }
  )
);
