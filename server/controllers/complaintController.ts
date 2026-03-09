import { Request, Response } from "express";
import { complaintService } from "../services/complaintService.ts";
import { emailService } from "../services/emailService.ts";
import { ComplaintStatus } from "../../src/types.ts";

export const complaintController = {
  submitComplaint: async (req: Request, res: Response) => {
    try {
      const complaint = await complaintService.create(req.body);
      
      // Send tracking ID via email if contact info looks like an email
      if (complaint.contactInfo && complaint.contactInfo.includes('@')) {
        // We don't await this to avoid delaying the response to the user
        emailService.sendTrackingCodeEmail(complaint.contactInfo, complaint.id, complaint.category);
      }
      
      res.status(201).json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error submitting complaint" });
    }
  },

  getComplaintById: async (req: Request, res: Response) => {
    try {
      const complaint = await complaintService.getById(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaint" });
    }
  },

  getAllComplaints: async (req: Request, res: Response) => {
    try {
      const complaints = await complaintService.getAll();
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaints" });
    }
  },

  assignComplaint: async (req: Request, res: Response) => {
    try {
      const { department } = req.body;
      const complaint = await complaintService.assign(req.params.id, department);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error assigning complaint" });
    }
  },

  updateComplaintStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const complaint = await complaintService.updateStatus(req.params.id, status as ComplaintStatus);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error updating status" });
    }
  }
};
