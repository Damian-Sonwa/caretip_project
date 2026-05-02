import { Router } from "express";
import * as staffController from "../controllers/staff.controller.js";

const router = Router();

// Public: staff by business + employee slug (must be before /directory/business/:slug)
router.get(
  "/directory/business/:businessSlug/employee/:employeeSlug",
  staffController.getStaffByBusinessAndEmployeeSlug
);

// Public: staff directory for business team QR (must be before /:slug)
router.get("/directory/business/:slug", staffController.listActiveEmployeesByBusinessSlug);

// Public: direct tipping link by employee slug
router.get("/:slug", staffController.getStaffBySlug);

export default router;
