import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { AppError } from "../utils/AppError";

// Take the first Zod error message to return to the client.
const firstMessage = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid data";

// Validate req.body and replace it with the cleaned data (trim, coercion, defaults...).
export const validateBody =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(400, "VALIDATION_ERROR", firstMessage(result.error)));
    }
    req.body = result.data;
    next();
  };

// Express 5: req.query is read-only, so store the result in res.locals.query.
export const validateQuery =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError(400, "VALIDATION_ERROR", firstMessage(result.error)));
    }
    res.locals.query = result.data;
    next();
  };

// Shared by every route with an :id param. A non-UUID id is treated as not found (404),
// which avoids a Postgres syntax error. Use validateId("userId") for a different param name.
export const validateId =
  (paramName = "id") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!z.uuid().safeParse(req.params[paramName]).success) {
      return next(new AppError(404, "NOT_FOUND", "Resource not found"));
    }
    next();
  };
