import "reflect-metadata";
import { app } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./data-source";

async function main() {
  await AppDataSource.initialize();
  console.log("Connected to PostgreSQL");
  app.listen(env.port, () => console.log(`Server running at http://localhost:${env.port}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
