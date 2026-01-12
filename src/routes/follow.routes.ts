import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import z from "zod";
import { HttpError } from "../middleware/errorMiddleware";
import { db } from "../db/client";
import { followersTable } from "../db";

export const followRouter = Router();

export const followUserSchema = z.object({
  followeeId: z.coerce.number(),
});

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
