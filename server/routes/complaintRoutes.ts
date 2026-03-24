import { Router } from "express";
import { complaintController } from "../controllers/complaintController.ts";
import { requireAdminAuth, requireOfficerAuth } from "../middleware/auth.ts";

const router = Router();

// Citizen Routes
router.post("/", complaintController.submitComplaint);
router.post("/bulk", requireAdminAuth, complaintController.bulkUpdate);
router.patch("/bulk", requireAdminAuth, complaintController.bulkUpdate);
router.get("/geodata", complaintController.getGeoData);
router.post("/collaborate", requireOfficerAuth, complaintController.addCollaborators);

// Admin / Officer Routes
router.get("/search", requireOfficerAuth, complaintController.searchComplaints);
router.get("/export", requireAdminAuth, complaintController.exportComplaints);
router.get("/", requireOfficerAuth, complaintController.getAllComplaints);
router.get("/breach-status", requireOfficerAuth, complaintController.getBreachStatus);
router.get("/sla-stats", requireAdminAuth, complaintController.getSlaStats);
router.get("/:id", complaintController.getComplaintById);
router.post("/:id/vote", complaintController.voteComplaint);
router.post("/:id/resolve", requireOfficerAuth, complaintController.resolveComplaint);
router.put("/:id/assign", requireAdminAuth, complaintController.assignComplaint);
router.put("/:id/status", requireOfficerAuth, complaintController.updateComplaintStatus);

export default router;
