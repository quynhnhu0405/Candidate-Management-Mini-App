import { Router } from "express";
import { summarizeRateLimit } from "../../shared/middlewares/rateLimit";
import { validateBody, validateId, validateQuery } from "../../shared/middlewares/validate";
import * as controller from "./candidate.controller";
import { candidateInputSchema, listQuerySchema, updateStatusSchema } from "./candidate.schema";

const router = Router();

router.get("/", validateQuery(listQuerySchema), controller.list);
router.post("/", validateBody(candidateInputSchema), controller.create);
router.get("/:id", validateId(), controller.getOne);
router.put("/:id", validateId(), validateBody(candidateInputSchema), controller.update);
router.patch(
  "/:id/status",
  validateId(),
  validateBody(updateStatusSchema),
  controller.updateStatus,
);
router.delete("/:id", validateId(), controller.remove);
// AI summary: rate limit first (protects the Gemini quota), then validate the id, then call the service
router.post("/:id/summarize", summarizeRateLimit, validateId(), controller.summarize);

export const candidateModule = router;
