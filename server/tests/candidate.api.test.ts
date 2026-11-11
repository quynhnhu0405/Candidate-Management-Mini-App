import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app";
import { summarizeExperience } from "../src/modules/ai/ai.service";
import { AppError } from "../src/shared/utils/AppError";
import { clearCandidates, connectDb, disconnectDb, validCandidate } from "./helpers";

// The AI service is mocked: tests never call Gemini (no network, no quota, no real key).
vi.mock("../src/modules/ai/ai.service", () => ({ summarizeExperience: vi.fn() }));
const summarizeMock = vi.mocked(summarizeExperience);

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

async function createCandidate(overrides: Record<string, unknown> = {}) {
  const res = await request(app).post("/api/candidates").send(validCandidate(overrides));
  expect(res.status).toBe(201);
  return res.body as { id: string; [key: string]: unknown };
}

beforeAll(connectDb);
afterAll(disconnectDb);
beforeEach(async () => {
  await clearCandidates();
  summarizeMock.mockReset();
});

describe("health and unknown routes", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("unknown route returns 404 in the standard error format", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: expect.any(String) } });
  });
});

describe("POST /api/candidates", () => {
  it("creates a candidate with status NEW and cleaned-up values", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .send(validCandidate({ fullName: "  Alex Tester  ", email: " ALEX.Tester@Example.COM " }));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      fullName: "Alex Tester", // trimmed
      email: "alex.tester@example.com", // trimmed + lower-cased
      status: "NEW",
      aiSummary: null,
      summarizedAt: null,
    });
    expect(res.body.id).toEqual(expect.any(String));
  });

  it("stores an empty phone as null", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .send(validCandidate({ phone: "" }));
    expect(res.status).toBe(201);
    expect(res.body.phone).toBeNull();
  });

  it("returns 400 when full name and email are missing", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .send({ position: "QA", yearsOfExperience: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it.each([
    ["invalid email", { email: "not-an-email" }],
    ["years above 50", { yearsOfExperience: 51 }],
    ["negative years", { yearsOfExperience: -1 }],
    ["years that is not a number", { yearsOfExperience: "many" }],
    ["empty position", { position: "   " }],
  ])("returns 400 for %s", async (_name, override) => {
    const res = await request(app).post("/api/candidates").send(validCandidate(override));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await request(app)
      .post("/api/candidates")
      .set("Content-Type", "application/json")
      .send("{oops");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 for a duplicate email (case-insensitive)", async () => {
    await createCandidate({ email: "dup@example.com" });
    const res = await request(app)
      .post("/api/candidates")
      .send(validCandidate({ email: "DUP@example.com" }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});

describe("GET /api/candidates/:id", () => {
  it("returns the candidate", async () => {
    const created = await createCandidate();
    const res = await request(app).get(`/api/candidates/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("alex.tester@example.com");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get(`/api/candidates/${UNKNOWN_ID}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 (not 500) for a malformed id", async () => {
    const res = await request(app).get("/api/candidates/not-a-uuid");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/candidates (list, search, filter, sort, pagination)", () => {
  // 12 candidates: names Candidate 01..12, statuses cycle NEW/CONTACTED/SHORTLISTED/REJECTED.
  async function seedTwelve() {
    const statuses = ["NEW", "CONTACTED", "SHORTLISTED", "REJECTED"];
    for (let i = 1; i <= 12; i++) {
      const n = String(i).padStart(2, "0");
      const created = await createCandidate({
        fullName: `Candidate ${n}`,
        email: `c${n}@example.com`,
      });
      await request(app)
        .patch(`/api/candidates/${created.id}/status`)
        .send({ status: statuses[(i - 1) % 4] });
    }
  }

  it("returns an empty list when there are no candidates", async () => {
    const res = await request(app).get("/api/candidates");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], total: 0, page: 1, pageSize: 10 });
  });

  it("paginates (default 10 per page, custom pageSize, last page)", async () => {
    await seedTwelve();

    const first = await request(app).get("/api/candidates");
    expect(first.body.data).toHaveLength(10);
    expect(first.body.total).toBe(12);

    const second = await request(app).get("/api/candidates").query({ page: 2 });
    expect(second.body.data).toHaveLength(2);

    const custom = await request(app).get("/api/candidates").query({ pageSize: 5, page: 3 });
    expect(custom.body).toMatchObject({ page: 3, pageSize: 5, total: 12 });
    expect(custom.body.data).toHaveLength(2);
  });

  it("rejects an invalid page size", async () => {
    const res = await request(app).get("/api/candidates").query({ pageSize: 101 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("sorts by name ascending and descending", async () => {
    await seedTwelve();
    const asc = await request(app).get("/api/candidates").query({ sort: "fullName", order: "asc" });
    expect(asc.body.data[0].fullName).toBe("Candidate 01");
    const desc = await request(app)
      .get("/api/candidates")
      .query({ sort: "fullName", order: "desc" });
    expect(desc.body.data[0].fullName).toBe("Candidate 12");
  });

  it("filters by status and returns counts for every status", async () => {
    await seedTwelve();
    const res = await request(app).get("/api/candidates").query({ status: "SHORTLISTED" });
    expect(res.body.total).toBe(3);
    expect(res.body.data.every((c: { status: string }) => c.status === "SHORTLISTED")).toBe(true);
    // counts ignore the status filter, so the tabs always show every status
    expect(res.body.statusCounts).toEqual({ NEW: 3, CONTACTED: 3, SHORTLISTED: 3, REJECTED: 3 });
  });

  it("searches name, email, position and skills ignoring case", async () => {
    await createCandidate({
      fullName: "Maria Garcia",
      email: "maria@example.com",
      position: "QA Engineer",
      skills: ["Cypress"],
    });
    await createCandidate({
      fullName: "John Smith",
      email: "john@example.com",
      position: "Designer",
      skills: ["Figma"],
    });

    const byName = await request(app).get("/api/candidates").query({ q: "MARIA" });
    expect(byName.body.data.map((c: { fullName: string }) => c.fullName)).toEqual(["Maria Garcia"]);

    const byEmail = await request(app).get("/api/candidates").query({ q: "john@" });
    expect(byEmail.body.total).toBe(1);

    const byPosition = await request(app).get("/api/candidates").query({ q: "qa eng" });
    expect(byPosition.body.total).toBe(1);

    const bySkill = await request(app).get("/api/candidates").query({ q: "figma" });
    expect(bySkill.body.data[0].fullName).toBe("John Smith");
  });

  it("searches without accents: 'quy' finds 'Quý' and 'dang' finds 'Đặng'", async () => {
    await createCandidate({
      fullName: "Đặng Quốc Quý",
      email: "quy@example.com",
      skills: ["Tin học văn phòng"],
    });
    await createCandidate({ fullName: "Someone Else", email: "other@example.com" });

    for (const q of ["quy", "qu", "Quý", "QUY", "dang", "đặng", "tin hoc"]) {
      const res = await request(app).get("/api/candidates").query({ q });
      expect(
        res.body.data.map((c: { email: string }) => c.email),
        `q=${q}`,
      ).toEqual(["quy@example.com"]);
    }
  });

  it("treats % and _ in the search text literally", async () => {
    await createCandidate({ fullName: "Plain Name", email: "plain@example.com" });
    const res = await request(app).get("/api/candidates").query({ q: "%" });
    expect(res.body.total).toBe(0);
  });
});

describe("PUT /api/candidates/:id", () => {
  it("updates every field", async () => {
    const created = await createCandidate();
    const res = await request(app)
      .put(`/api/candidates/${created.id}`)
      .send(
        validCandidate({
          fullName: "Alex Updated",
          position: "Tech Lead",
          yearsOfExperience: 9,
          skills: ["Go"],
        }),
      );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      fullName: "Alex Updated",
      position: "Tech Lead",
      yearsOfExperience: 9,
      skills: ["Go"],
    });
  });

  it("returns 404 for an unknown id and 409 when the new email is already used", async () => {
    const missing = await request(app).put(`/api/candidates/${UNKNOWN_ID}`).send(validCandidate());
    expect(missing.status).toBe(404);

    await createCandidate({ email: "taken@example.com" });
    const other = await createCandidate({ email: "other@example.com" });
    const conflict = await request(app)
      .put(`/api/candidates/${other.id}`)
      .send(validCandidate({ email: "taken@example.com" }));
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});

describe("PATCH /api/candidates/:id/status", () => {
  it("changes the status", async () => {
    const created = await createCandidate();
    const res = await request(app)
      .patch(`/api/candidates/${created.id}/status`)
      .send({ status: "SHORTLISTED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("SHORTLISTED");
  });

  it("returns 400 for an invalid status and 404 for an unknown candidate", async () => {
    const created = await createCandidate();
    const invalid = await request(app)
      .patch(`/api/candidates/${created.id}/status`)
      .send({ status: "HIRED" });
    expect(invalid.status).toBe(400);

    const missing = await request(app)
      .patch(`/api/candidates/${UNKNOWN_ID}/status`)
      .send({ status: "NEW" });
    expect(missing.status).toBe(404);
  });
});

describe("DELETE /api/candidates/:id", () => {
  it("deletes the candidate, then it is gone", async () => {
    const created = await createCandidate();
    const del = await request(app).delete(`/api/candidates/${created.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/candidates/${created.id}`);
    expect(get.status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(`/api/candidates/${UNKNOWN_ID}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/candidates/:id/summarize", () => {
  it("returns 400 and does not call the AI when the experience is too short", async () => {
    const created = await createCandidate({ experience: "Too short." });
    const res = await request(app).post(`/api/candidates/${created.id}/summarize`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("EXPERIENCE_TOO_SHORT");
    expect(summarizeMock).not.toHaveBeenCalled();
  });

  it("saves the AI summary and passes the candidate data to the AI service", async () => {
    summarizeMock.mockResolvedValue(
      "- Four years of backend work.\n- Uses Node.js and PostgreSQL.",
    );
    const created = await createCandidate();

    const res = await request(app).post(`/api/candidates/${created.id}/summarize`);
    expect(res.status).toBe(200);
    expect(res.body.aiSummary).toBe(
      "- Four years of backend work.\n- Uses Node.js and PostgreSQL.",
    );
    expect(res.body.summarizedAt).toEqual(expect.any(String));

    expect(summarizeMock).toHaveBeenCalledWith({
      position: "Backend Developer",
      yearsOfExperience: 4,
      skills: ["Node.js", "PostgreSQL"],
      experience:
        "Four years building REST APIs with Node.js and PostgreSQL for a logistics company.",
    });

    // it is stored in the database, not just returned
    const saved = await request(app).get(`/api/candidates/${created.id}`);
    expect(saved.body.aiSummary).toBe(res.body.aiSummary);
  });

  it("regenerates: calling it again replaces the previous summary", async () => {
    const created = await createCandidate();
    summarizeMock.mockResolvedValueOnce("- first");
    await request(app).post(`/api/candidates/${created.id}/summarize`);
    summarizeMock.mockResolvedValueOnce("- second");
    const res = await request(app).post(`/api/candidates/${created.id}/summarize`);
    expect(res.body.aiSummary).toBe("- second");
  });

  it("returns 502 and keeps the old summary when the AI service fails", async () => {
    const created = await createCandidate();
    summarizeMock.mockResolvedValueOnce("- old summary");
    await request(app).post(`/api/candidates/${created.id}/summarize`);

    summarizeMock.mockRejectedValueOnce(
      new AppError(502, "AI_TIMEOUT", "The AI service took too long to respond"),
    );
    const res = await request(app).post(`/api/candidates/${created.id}/summarize`);
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("AI_TIMEOUT");

    const saved = await request(app).get(`/api/candidates/${created.id}`);
    expect(saved.body.aiSummary).toBe("- old summary");
  });

  it("returns 404 for an unknown candidate", async () => {
    const res = await request(app).post(`/api/candidates/${UNKNOWN_ID}/summarize`);
    expect(res.status).toBe(404);
    expect(summarizeMock).not.toHaveBeenCalled();
  });
});
