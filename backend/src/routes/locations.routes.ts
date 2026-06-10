import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import * as locationsController from "../controllers/locations.controller.js";

const router = Router();

router.get("/", authMiddleware, requireVerifiedEmail, requireRole(Role.MANAGER), locationsController.listLocations);
router.post("/", authMiddleware, requireVerifiedEmail, requireRole(Role.MANAGER), locationsController.createLocation);

export default router;
