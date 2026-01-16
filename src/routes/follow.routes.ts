import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import z from "zod";
import { HttpError } from "../middleware/errorMiddleware";
import { db } from "../db/client";
import { followersTable } from "../db";
import { and, eq } from "drizzle-orm";

export const followRouter = Router();

export const followUserSchema = z.object({
  followeeId: z.coerce.number(),
});

// get followers list
followRouter.get(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const userId = request.user?.userId;
      if (!userId) {
        throw new HttpError(401, "Missing token", {});
      }
      const following = await db
        .select({
          followeeId: followersTable.followeeId,
          createdAt: followersTable.createdAt,
        })
        .from(followersTable)
        .where(eq(followersTable.followerId, userId));

      return response.status(200).json([...following]);
    }
  )
);

followRouter.post(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const userId = request.user?.userId;
      if (!userId) {
        throw new HttpError(401, "Invalid credentials", {});
      }
      const parsedBody = followUserSchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new HttpError(400, "Bad request", {});
      }
      const { followeeId } = parsedBody.data;

      const [followUser] = await db
        .insert(followersTable)
        .values({
          followerId: userId,
          followeeId: followeeId,
        })
        .returning();

      return response.status(201).json({
        ...followUser,
      });
    }
  )
);

export const deleteFolloweeSchema = z.object({
  followeeId: z.coerce.number(),
});

// UserId unfollowers followeeId
followRouter.delete(
  "/:followeeId",
  asyncHandler(
    async (reqeuest: Request, response: Response, next: NextFunction) => {
      const userId = reqeuest.user?.userId;
      if (!userId) {
        throw new HttpError(401, "Missing token", {});
      }
      const parsedParams = deleteFolloweeSchema.safeParse(reqeuest.params);
      if (!parsedParams.success) {
        throw new HttpError(400, "Bad Request", {});
      }
      const { followeeId } = parsedParams.data;

      const [deletedRelationship] = await db
        .delete(followersTable)
        .where(
          and(
            eq(followersTable.followerId, userId),
            eq(followersTable.followeeId, followeeId)
          )
        )
        .returning();

      response.status(204).json({
        deletedRelationship,
      });
    }
  )
);
