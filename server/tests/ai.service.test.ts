import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Gemini SDK: no network, no quota. The service loads it with import(), and vi.mock covers that too.
const generateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { buildPrompt, parseSummary, summarizeExperience } from "../src/modules/ai/ai.service";

const input = {
  position: "Backend Developer",
  yearsOfExperience: 5,
  skills: ["Node.js", "PostgreSQL"],
  experience: "Built payment APIs for a fintech startup and mentored two juniors.",
};

// Gemini's ApiError carries the HTTP status of the failed call.
const geminiError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

beforeEach(() => {
  generateContent.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {}); // the service logs failures; keep test output clean
});
afterEach(() => vi.restoreAllMocks());

describe("buildPrompt", () => {
  it("puts all candidate fields inside <candidate> tags as data", () => {
    const prompt = buildPrompt(input);
    expect(prompt.startsWith("<candidate>")).toBe(true);
    expect(prompt.endsWith("</candidate>")).toBe(true);
    expect(prompt).toContain("Position: Backend Developer");
    expect(prompt).toContain("Years of experience: 5");
    expect(prompt).toContain("Skills: Node.js, PostgreSQL");
    expect(prompt).toContain(input.experience);
  });

  it("says when there are no skills", () => {
    expect(buildPrompt({ ...input, skills: [] })).toContain("Skills: not provided");
  });
});

describe("parseSummary", () => {
  it("returns clean '- text' lines", () => {
    expect(parseSummary("- one\n- two\n- three")).toBe("- one\n- two\n- three");
  });

  it("normalizes other bullet styles and numbering, and drops blank lines", () => {
    expect(parseSummary("* one\n\n• two\n1. three\n2) four")).toBe("- one\n- two\n- three\n- four");
  });

  it("keeps at most 5 lines", () => {
    const text = Array.from({ length: 9 }, (_, i) => `- line ${i + 1}`).join("\n");
    expect(parseSummary(text).split("\n")).toHaveLength(5);
  });

  it("throws AI_EMPTY_RESPONSE for an empty answer", () => {
    expect(() => parseSummary("  \n \n")).toThrowError(
      expect.objectContaining({ code: "AI_EMPTY_RESPONSE", status: 502 }),
    );
  });
});

describe("summarizeExperience", () => {
  it("returns the parsed summary and asks Gemini with the right settings", async () => {
    generateContent.mockResolvedValue({
      text: "- Five years of backend work\n- Node.js and PostgreSQL",
    });

    const summary = await summarizeExperience(input);
    expect(summary).toBe("- Five years of backend work\n- Node.js and PostgreSQL");

    const call = generateContent.mock.calls[0][0];
    expect(call.contents).toContain("Backend Developer");
    expect(call.config.systemInstruction).toContain("Never guess or invent facts");
    expect(call.config.httpOptions.timeout).toEqual(expect.any(Number)); // request timeout is set
  });

  it.each([
    ["quota exceeded (429)", geminiError(429, "quota"), "AI_QUOTA_EXCEEDED"],
    ["invalid key (403)", geminiError(403, "forbidden"), "AI_AUTH_ERROR"],
    [
      "invalid key (400 'API key not valid')",
      geminiError(400, "API key not valid"),
      "AI_AUTH_ERROR",
    ],
    ["gateway timeout (504)", geminiError(504, "deadline"), "AI_TIMEOUT"],
    ["aborted request", new Error("This operation was aborted"), "AI_TIMEOUT"],
    ["server error (503)", geminiError(503, "high demand"), "AI_UPSTREAM_ERROR"],
    ["unknown failure", new Error("boom"), "AI_UPSTREAM_ERROR"],
  ])("maps %s to a 502 %s", async (_name, error, code) => {
    generateContent.mockRejectedValue(error);
    await expect(summarizeExperience(input)).rejects.toMatchObject({ status: 502, code });
  });

  it("does not leak technical details in the error message", async () => {
    generateContent.mockRejectedValue(geminiError(403, "secret internal details"));
    await expect(summarizeExperience(input)).rejects.toMatchObject({
      message: expect.not.stringContaining("secret internal details"),
    });
  });

  it("throws AI_NOT_CONFIGURED when the server has no API key", async () => {
    vi.resetModules();
    const previous = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "";
    try {
      const fresh = await import("../src/modules/ai/ai.service");
      await expect(fresh.summarizeExperience(input)).rejects.toMatchObject({
        status: 502,
        code: "AI_NOT_CONFIGURED",
      });
      expect(generateContent).not.toHaveBeenCalled();
    } finally {
      process.env.GEMINI_API_KEY = previous;
    }
  });
});
