import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController.ts";

const router = Router();

router.get("/overview", analyticsController.getOverview);
router.get("/trends", analyticsController.getTrends);
router.get("/performance", analyticsController.getPerformance);
router.get("/sentiment", analyticsController.getSentiment);

export default router;
