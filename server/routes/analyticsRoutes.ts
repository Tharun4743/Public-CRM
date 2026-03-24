import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController.ts";
import { requireAdminAuth } from "../middleware/auth.ts";

const router = Router();

router.get("/overview", requireAdminAuth, analyticsController.getOverview);
router.get("/trends", requireAdminAuth, analyticsController.getTrends);
router.get("/performance", requireAdminAuth, analyticsController.getPerformance);
router.get("/sentiment", requireAdminAuth, analyticsController.getSentiment);

export default router;
