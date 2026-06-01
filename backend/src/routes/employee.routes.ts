import { Router } from "express";
import multer from "multer";
import { Role } from "@prisma/client";
import { authMiddleware, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { isApprovedBusiness } from "../middleware/isApprovedBusiness.middleware.js";
import * as employeeController from "../controllers/employee.controller.js";
import * as goalController from "../controllers/goal.controller.js";
import { isAllowedImageMimetype } from "../services/upload.service.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageMimetype(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image type. Use JPEG, PNG, GIF, WebP, HEIC, or AVIF."));
    }
  },
});

// Employee self-service (must be before /:employeeId — "me" is not an id here but order matters for other routes)
router.get("/me", authMiddleware, requireRole(Role.EMPLOYEE), employeeController.getMyProfile);
router.post("/me/ensure-slug", authMiddleware, requireRole(Role.EMPLOYEE), employeeController.ensureMySlug);
router.patch("/me", authMiddleware, requireRole(Role.EMPLOYEE), employeeController.patchMyProfile);
router.post(
  "/me/avatar",
  authMiddleware,
  requireRole(Role.EMPLOYEE),
  upload.single("avatar"),
  employeeController.uploadMyAvatar
);
router.get("/me/export", authMiddleware, requireRole(Role.EMPLOYEE), employeeController.exportMyData);
router.delete("/me", authMiddleware, requireRole(Role.EMPLOYEE), employeeController.deleteMyAccount);

router.get("/me/goal", authMiddleware, requireRole(Role.EMPLOYEE), goalController.getMyGoal);
router.put("/me/goal", authMiddleware, requireRole(Role.EMPLOYEE), goalController.putMyGoal);
router.delete("/me/goal", authMiddleware, requireRole(Role.EMPLOYEE), goalController.deleteMyGoal);

// Public: list employees by businessId (must be before :employeeId to avoid matching "")
router.get("/", employeeController.getEmployees);
// Public: single employee by ID (for direct-tip QR landing)
router.get("/:employeeId", employeeController.getEmployeeById);

// Business only: add employee to their business
router.post("/", authMiddleware, requireRole(Role.MANAGER), isApprovedBusiness, employeeController.createEmployee);
router.post(
  "/:employeeId/regenerate-slug",
  authMiddleware,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  employeeController.regenerateEmployeeSlug
);
router.patch(
  "/:employeeId/status",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  isApprovedBusiness,
  employeeController.patchEmployeeStatus
);
router.patch("/:employeeId", authMiddleware, requireRole(Role.MANAGER), isApprovedBusiness, employeeController.updateEmployee);
router.delete("/:employeeId", authMiddleware, requireRole(Role.MANAGER), isApprovedBusiness, employeeController.deleteEmployee);

export default router;
