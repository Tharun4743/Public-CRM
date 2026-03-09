import { Router } from "express";
import { complaintController } from "../controllers/complaintController.ts";

const router = Router();

// Citizen Routes
router.post("/", complaintController.submitComplaint);
router.get("/:id", complaintController.getComplaintById);

// Admin/Officer Routes
router.get("/", complaintController.getAllComplaints);
router.put("/:id/assign", complaintController.assignComplaint);
router.put("/:id/status", complaintController.updateComplaintStatus);

export default router;
