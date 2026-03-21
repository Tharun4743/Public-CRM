import { Router } from "express";
import { feedbackController } from "../controllers/feedbackController.ts";

const router = Router();

router.get("/complaint", feedbackController.getComplaintByToken);
router.post("/", feedbackController.submitFeedback);

export default router;
