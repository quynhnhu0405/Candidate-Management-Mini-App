import { config } from "dotenv";

config({ quiet: true }); // load server/.env without dotenv's startup log line

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} in server/.env`);
  return value;
};

export const env = {
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    name: required("DB_NAME"),
  },
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 20000),
  aiRateLimitPerMinute: Number(process.env.AI_RATE_LIMIT_PER_MINUTE ?? 5),
};
