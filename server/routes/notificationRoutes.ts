import { Router } from "express";
import { notificationController } from "../controllers/notificationController.ts";
import { requireCitizenAuth } from "../middleware/auth.ts";

const router = Router();

router.get("/", requireCitizenAuth, notificationController.getNotifications);
router.patch("/:id/read", requireCitizenAuth, notificationController.markRead);
router.patch("/read-all", requireCitizenAuth, notificationController.markAllRead);

export default router;
