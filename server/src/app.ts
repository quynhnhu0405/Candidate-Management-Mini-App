import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./shared/middlewares/errorHandler";
import routes from "./modules";

// App is created separately from listen() so Supertest can use it.
export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
