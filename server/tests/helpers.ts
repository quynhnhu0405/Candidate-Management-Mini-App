import { AppDataSource } from "../src/data-source";

export async function connectDb() {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
}

export async function clearCandidates() {
  await AppDataSource.query('TRUNCATE TABLE "candidates"');
}

export async function disconnectDb() {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}

// A valid body for POST /api/candidates (fake data). Override fields per test.
export const validCandidate = (overrides: Record<string, unknown> = {}) => ({
  fullName: "Alex Tester",
  email: "alex.tester@example.com",
  phone: "0912345678",
  position: "Backend Developer",
  yearsOfExperience: 4,
  skills: ["Node.js", "PostgreSQL"],
  experience: "Four years building REST APIs with Node.js and PostgreSQL for a logistics company.",
  ...overrides,
});
