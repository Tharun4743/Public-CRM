import express from "express";
import { auditController } from "../controllers/auditController.ts";
import { requireAdminAuth } from "../middleware/auth.ts";

const router = express.Router();

router.get("/", requireAdminAuth, auditController.getLogs);

export default router;
