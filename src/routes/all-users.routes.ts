import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import { db } from "../db/client";
import { usersTable } from "../db";
import users from "../mock/mock_users.json";
import { HttpError } from "../middleware/errorMiddleware";
import bcrypt from "bcryptjs";

export const allUsersRouter = Router();

allUsersRouter.get(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const users = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          username: usersTable.username,
          password: usersTable.passwordHash,
        })
        .from(usersTable);

      return response.status(200).json({
        users,
      });
    }
  )
);

allUsersRouter.post(
  "/",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const usersData = await Promise.all(
        users.map(async (user) => {
          return {
            name: user.name,
            username: user.username,
            email: user.email,
            address: user.address,
            passwordHash: await bcrypt.hash(user.password, 10),
            country: user.country,
            isPrivate: user.isPrivate,
            bio: user.bio,
          };
        })
      );

      console.log(usersData);

      const insertAllUsers = await db.transaction(async (transaction) => {
        const success = await transaction.delete(usersTable);
        if (!success) {
          throw new HttpError(401, "Error in deleting users", {});
        }
        console.log("Users table data deleted....");
        const newUsers = await transaction
          .insert(usersTable)
          .values(usersData)
          .returning();
        console.log("New Users data inserted....");
        return newUsers;
      });

      return response.status(200).json({ users: insertAllUsers });
    }
  )
);
