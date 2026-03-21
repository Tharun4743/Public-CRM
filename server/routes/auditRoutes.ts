import express from "express";
import { auditController } from "../controllers/auditController.ts";

const router = express.Router();

router.get("/", auditController.getLogs);

export default router;
