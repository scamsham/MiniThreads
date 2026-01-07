import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../lib/env";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorMiddleware";

export type User = {
  userId: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function signJwt(payload: User) {
  return jwt.sign({}, env.JWT_SECRET as string, {
    subject: String(payload.userId),
    expiresIn: "1d",
  });
}

export function auth(request: Request, response: Response, next: NextFunction) {
  const authHeader = request.header("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Token missing subject", null);
  }
  const authParts = authHeader.split(" ");
  if (authParts[0] !== "Bearer" || !authParts[1]) {
    throw new HttpError(401, "Token missing subject", null);
  }
  const token = authParts[1] as string;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.sub) {
      throw new HttpError(401, "Token missing subject", null);
    }

    request.user = {
      userId: Number(decoded.sub),
    };
    next();
  } catch (error) {
    throw new HttpError(401, "Token missing subject", null);
  }
}
