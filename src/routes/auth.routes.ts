import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../middleware/errorMiddleware";
import { db } from "../db/client";
import { usersTable } from "../db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signJwt } from "../auth/jwt";
import { loginSchema, signinSchema } from "../validations/auth.validation";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new HttpError(400, "Bad request", null);
      }
      const { email, password } = parsed.data;

      const [row] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!row) {
        throw new HttpError(404, "Invalid credentials", null);
      }

      const isPasswordMatch = await bcrypt.compare(
        password,
        String(row?.passwordHash)
      );

      if (!isPasswordMatch) {
        throw new HttpError(401, "Invalid credentials", null);
      }

      const token = signJwt({ userId: Number(row.id) });

      return response.status(200).json({
        token,
        user: {
          username: row.username,
          name: row.name,
          displayPictureUrl: row.displayPictureUrl,
        },
      });
    }
  )
);

authRouter.post(
  "/sign-in",
  asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
      const parsed = signinSchema.safeParse(request.body);
      if (!parsed.success) {
        return new HttpError(400, "Bad Request", parsed.error.flatten());
      }
      const {
        name,
        username,
        email,
        password,
        address,
        country,
        isPrivate,
        bio,
      } = parsed.data;

      const passwordHash = await bcrypt.hash(password, 10);
      // const passwordHash = password;

      const newUser = await db.transaction(async (transaction) => {
        // check if user exists
        const userExists = await transaction
          .select()
          .from(usersTable)
          .where(
            or(eq(usersTable.email, email), eq(usersTable.username, username))
          )
          .limit(1);

        if (userExists.length > 0) {
          throw new HttpError(409, "User already exists", null);
        }

        // Insert new user
        const [inserted] = await transaction
          .insert(usersTable)
          .values({
            name,
            username,
            email,
            passwordHash,
            address,
            country,
            isPrivate,
            bio,
          })
          .returning({
            id: usersTable.id,
            username: usersTable.username,
            email: usersTable.email,
          });

        return inserted;
      });

      return response
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    }
  )
);
