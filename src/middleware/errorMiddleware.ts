import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  public readonly status: number;
  public readonly details: unknown;
  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "HttpError";
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export function errorMiddleware(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({
      message: error?.message,
      details: error?.details ?? null,
    });
  }

  console.error(`Unexpected error: ${error}`);
  return response.status(500).json({ message: "Internal Server Error." });
}
