import { Router } from "express";
import { anomalyController } from "../controllers/anomalyController.ts";
import { requireAdminAuth } from "../middleware/auth.ts";

const router = Router();

router.get("/active", requireAdminAuth, anomalyController.getActiveAlerts);
router.patch("/:id/acknowledge", requireAdminAuth, anomalyController.acknowledgeAlert);

export default router;
