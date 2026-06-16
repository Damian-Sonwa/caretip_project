import { Router } from "express";
import { publicSocketTokenRateLimit } from "../middleware/securityRateLimit.middleware.js";
import * as socketController from "../controllers/socket.controller.js";

const router = Router();

router.get(
  "/public-room-token",
  publicSocketTokenRateLimit,
  socketController.getPublicRoomToken,
);

export default router;
