import { Router } from "express";
import { aiController } from "../controllers/aiController.ts";
import { requireAdminAuth, requireAnyAuth, requireOfficerAuth } from "../middleware/auth.ts";

const router = Router();

router.post("/analyze", requireAnyAuth, aiController.analyze);
router.post("/resolution", requireOfficerAuth, aiController.getResolution);
router.post('/detect', requireAdminAuth, aiController.detectAnomaly);

export default router;
