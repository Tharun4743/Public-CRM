import { Router } from "express";
import { aiController } from "../controllers/aiController.ts";

const router = Router();

router.post("/analyze", aiController.analyze);
router.post("/resolution", aiController.getResolution);
router.post('/detect', aiController.detectAnomaly);

export default router;
