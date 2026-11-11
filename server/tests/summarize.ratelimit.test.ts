import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Lower the limit for THIS file only. vi.hoisted runs before the imports below, and the rate limiter reads
// the value when it is first imported.
vi.hoisted(() => {
  process.env.AI_RATE_LIMIT_PER_MINUTE = "2";
});

import { app } from "../src/app";
import { summarizeExperience } from "../src/modules/ai/ai.service";
import { clearCandidates, connectDb, disconnectDb, validCandidate } from "./helpers";

vi.mock("../src/modules/ai/ai.service", () => ({ summarizeExperience: vi.fn() }));

describe("rate limit on POST /api/candidates/:id/summarize", () => {
  beforeAll(async () => {
    await connectDb();
    await clearCandidates();
  });
  afterAll(disconnectDb);

  it("allows 2 calls per minute, then answers 429 RATE_LIMITED", async () => {
    vi.mocked(summarizeExperience).mockResolvedValue("- ok");
    const created = await request(app).post("/api/candidates").send(validCandidate());
    const url = `/api/candidates/${created.body.id}/summarize`;

    expect((await request(app).post(url)).status).toBe(200);
    expect((await request(app).post(url)).status).toBe(200);

    const limited = await request(app).post(url);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("RATE_LIMITED");
    expect(limited.headers["ratelimit"]).toBeDefined(); // clients can see the remaining quota

    expect(summarizeExperience).toHaveBeenCalledTimes(2); // the blocked call never reached the AI
  });

  it("does not limit the other endpoints", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await request(app).get("/api/candidates")).status).toBe(200);
    }
  });
});
