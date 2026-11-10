import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { Candidate } from "./entities/Candidate";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  entities: [Candidate],
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  uuidExtension: "pgcrypto",
  synchronize: false,
});
