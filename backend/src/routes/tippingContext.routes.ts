import { Router } from "express";
import * as tippingContextController from "../controllers/tippingContext.controller.js";

const router = Router();

/** Public — must be registered before `/:qrSlug` so "location" is not captured as a slug. */
router.get("/location/:locationId", tippingContextController.getLocationById);
router.get("/table/:tableId", tippingContextController.getTableById);

router.get("/:qrSlug", tippingContextController.getByQrSlug);

export default router;
