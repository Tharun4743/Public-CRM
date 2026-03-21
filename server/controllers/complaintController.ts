import { Request, Response } from "express";
import { complaintService } from "../services/complaintService.ts";
import { emailService } from "../services/emailService.ts";
import { duplicateService } from "../services/duplicateService.ts";
import { ComplaintStatus } from "../../src/types.ts";
import db from "../db/database.ts";
import { aiService } from "../services/aiService.ts";

export const complaintController = {
  submitComplaint: async (req: Request, res: Response) => {
    try {
      const { description, category, forceSubmit, citizen_email, citizen_phone, contactInfo } = req.body;
      const targetEmail = citizen_email || contactInfo;
      const past = targetEmail
        ? (db.prepare('SELECT category FROM complaints WHERE citizen_email = ? OR contactInfo = ? ORDER BY createdAt DESC LIMIT 25').all(targetEmail, targetEmail) as any[]).map((r) => r.category)
        : [];
      const ai = await aiService.analyzeComplaint(description, category, past);

      if (!forceSubmit) {
        const check = await duplicateService.checkDuplicates(description, category);
        if (check.isDuplicate) {
          const original = await complaintService.getById(check.matchedId);
          return res.status(200).json({ 
            isDuplicate: true, 
            matchedComplaint: original,
            score: check.score,
            summary: check.summary
          });
        }
      }

      const complaint = await complaintService.create({
        ...req.body,
        contactInfo: targetEmail, // Ensure contactInfo is populated for legacy views
        ai_priority: req.body.ai_priority || ai.suggestedPriority,
        sentiment_score: req.body.sentiment_score || ai.sentimentScore,
        urgency_level: req.body.urgency_level || ai.urgencyLevel,
        estimated_resolution_days: req.body.estimated_resolution_days || ai.estimatedResolutionDays,
        ai_summary: req.body.ai_summary || ai.summary,
        ai_tags: req.body.ai_tags || ai.tags
      });
      
      if (targetEmail && targetEmail.includes('@')) {
        emailService.sendTrackingCodeEmail(targetEmail, complaint.id, complaint.category);
      }
      
      res.status(201).json(complaint);
    } catch (error) {
      console.error("EXACT SUBMISSION ERROR IS:", error);
      res.status(500).json({ message: "Error submitting complaint", error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  voteComplaint: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const result = await duplicateService.addMyVote(id, email);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error voting" });
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
  },

  getBreachStatus: async (req: Request, res: Response) => {
    try {
      const status = await complaintService.hasBreached();
      res.json({ hasBreached: status });
    } catch (error) {
      res.status(500).json({ hasBreached: false });
    }
  },

  getSlaStats: async (req: Request, res: Response) => {
    try {
      const stats = await complaintService.getSlaStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching SLA stats" });
    }
  },

  resolveComplaint: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { proof, notes, officerId } = req.body;
      const complaint = await complaintService.resolve(id, proof, notes, officerId);
      if (!complaint) return res.status(404).json({ message: "Complaint not found" });
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error resolving complaint" });
    }
  },

  searchComplaints: async (req: Request, res: Response) => {
    try {
      const { q, category, priority, status, department, dateFrom, dateTo, slaStatus, minSentiment, maxSentiment, page } = req.query;
      const filters = { q, category, priority, status, department, dateFrom, dateTo, slaStatus, minSentiment, maxSentiment };
      const result = await complaintService.search(filters, Number(page) || 1);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error during smart search" });
    }
  },

  exportComplaints: async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const csv = await complaintService.generateCsv(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=complaints_export.csv');
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ message: "Error generating export" });
    }
  },
  getGeoData: async (_req: Request, res: Response) => {
    try {
      const rows = await complaintService.getGeoData();
      res.json(rows);
    } catch {
      res.status(500).json({ message: 'Error fetching geodata' });
    }
  },
  bulkUpdate: async (req: Request, res: Response) => {
    try {
      const { complaintIds, action } = req.body;
      const result = await complaintService.bulkUpdate(complaintIds || [], action || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error in bulk update" });
    }
  },
  addCollaborators: async (req: Request, res: Response) => {
    try {
      const { complaintId, departmentIds, notes } = req.body;
      const stmt = db.prepare(`
        INSERT INTO complaint_collaborators (complaint_id, department_id, assigned_at, sub_status, notes)
        VALUES (?, ?, ?, 'Pending', ?)
      `);
      for (const dep of departmentIds || []) {
        stmt.run(complaintId, dep, new Date().toISOString(), notes || null);
      }
      res.status(201).json({ ok: true });
    } catch {
      res.status(500).json({ message: 'Collaboration failed' });
    }
  }
};
