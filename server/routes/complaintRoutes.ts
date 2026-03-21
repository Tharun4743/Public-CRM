import { Router } from "express";
import { complaintController } from "../controllers/complaintController.ts";

const router = Router();

// Citizen Routes
router.post("/", complaintController.submitComplaint);
router.post("/bulk", complaintController.bulkUpdate);
router.patch("/bulk", complaintController.bulkUpdate);
router.get("/geodata", complaintController.getGeoData);
router.post("/collaborate", complaintController.addCollaborators);

// Admin / Officer Routes
router.get("/search", complaintController.searchComplaints);
router.get("/export", complaintController.exportComplaints);
router.get("/", complaintController.getAllComplaints);
router.get("/breach-status", complaintController.getBreachStatus);
router.get("/sla-stats", complaintController.getSlaStats);
router.get("/:id", complaintController.getComplaintById);
router.post("/:id/vote", complaintController.voteComplaint);
router.post("/:id/resolve", complaintController.resolveComplaint);
router.put("/:id/assign", complaintController.assignComplaint);
router.put("/:id/status", complaintController.updateComplaintStatus);

export default router;
