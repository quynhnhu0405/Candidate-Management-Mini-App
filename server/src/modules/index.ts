import { Router } from "express";
import { candidateModule } from "./candidate/candidate.module";
import { healthModule } from "./health/health.module";

// Mount each module under its prefix. Add a new module = add one line here.
const router = Router();

router.use("/health", healthModule);
router.use("/candidates", candidateModule);

export default router;
