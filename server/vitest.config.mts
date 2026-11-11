import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ quiet: true });

// Tests run against their OWN database (<DB_NAME>_test), so your development data is never touched.
const testDbName = `${process.env.DB_NAME ?? "candidates"}_test`;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    fileParallelism: false, // all test files share one database, so run them one after another
    env: {
      DB_NAME: testDbName,
      GEMINI_API_KEY: "fake-key-for-tests", // tests must never use the real key (the AI service is mocked anyway)
      AI_RATE_LIMIT_PER_MINUTE: "100", // high default; the rate-limit test lowers it for itself
    },
  },
});
