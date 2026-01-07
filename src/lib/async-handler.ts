import { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(
  fn: (
    request: Request,
    response: Response,
    next: NextFunction
  ) => Promise<unknown>
): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
}
