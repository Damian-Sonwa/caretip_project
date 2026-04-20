import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-tip-session", paymentController.createTipSession);
router.get("/tip-session/:sessionId", paymentController.getTipSessionContext);

export default router;
