import { Router } from "express";
import { anomalyController } from "../controllers/anomalyController.ts";

const router = Router();

router.get("/active", anomalyController.getActiveAlerts);
router.patch("/:id/acknowledge", anomalyController.acknowledgeAlert);

export default router;
