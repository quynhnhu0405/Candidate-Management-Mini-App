import { execSync } from "node:child_process";
import { Client } from "pg";

// Runs once before all tests: creates the test database if needed and applies the migrations to it.
export default async function setup() {
  const testDbName = `${process.env.DB_NAME}_test`;

  const admin = new Client({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres", // connect to the default database to be able to CREATE DATABASE
  });
  await admin.connect();
  try {
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [testDbName]);
    if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${testDbName}"`);
  } finally {
    await admin.end();
  }

  // Same migrations as development, pointed at the test database.
  execSync("npm run migration:run --silent", {
    env: { ...process.env, DB_NAME: testDbName },
    stdio: "pipe",
  });
}
