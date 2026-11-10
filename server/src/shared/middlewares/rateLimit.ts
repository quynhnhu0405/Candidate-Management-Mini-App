import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { AppError } from "../utils/AppError";

// Limits how often one IP can call the AI summary endpoint, to protect the Gemini quota.
// Over the limit -> HTTP 429 in the standard { error: { code, message } } format (via errorHandler).
export const summarizeRateLimit = rateLimit({
  windowMs: 60_000,
  limit: env.aiRateLimitPerMinute,
  standardHeaders: "draft-7", // sends RateLimit headers so clients can see the remaining quota
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      new AppError(
        429,
        "RATE_LIMITED",
        "Too many summary requests, please wait a moment and try again",
      ),
    ),
});
