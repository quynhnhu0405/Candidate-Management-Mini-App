import type { NextFunction, Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { AppError } from "../utils/AppError";

const UNIQUE_VIOLATION = "23505";

const send = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

export const notFoundHandler = (_req: Request, res: Response) =>
  send(res, 404, "NOT_FOUND", "Route not found");

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return send(res, err.status, err.code, err.message);
  }

  if (
    err instanceof QueryFailedError &&
    (err.driverError as { code?: string } | undefined)?.code === UNIQUE_VIOLATION
  ) {
    return send(res, 409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }

  if ((err as { type?: string })?.type === "entity.parse.failed") {
    return send(res, 400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  console.error(err);
  return send(res, 500, "INTERNAL_ERROR", "Something went wrong, please try again later");
};
