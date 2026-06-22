import { Router } from "express";
import * as leadController from "../controllers/lead.controller.js";
import { leadSubmissionLimiter } from "../middleware/leadRateLimit.middleware.js";

const router = Router();

router.post("/demo", leadSubmissionLimiter, leadController.submitDemoLead);
router.post("/support", leadSubmissionLimiter, leadController.submitSupportLead);

export default router;
