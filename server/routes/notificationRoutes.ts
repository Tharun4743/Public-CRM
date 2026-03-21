import { Router } from "express";
import { notificationController } from "../controllers/notificationController.ts";

const router = Router();

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markRead);
router.patch("/read-all", notificationController.markAllRead);

export default router;
