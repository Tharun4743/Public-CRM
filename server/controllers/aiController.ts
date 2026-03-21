import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { complaintService } from '../services/complaintService';

export const aiController = {
  analyze: async (req: Request, res: Response) => {
    try {
      const { description, category } = req.body;
      const analysis = await aiService.analyzeComplaint(description, category);
      res.json(analysis);
    } catch (error) {
      console.error("AI Controller Error:", error);
      res.status(500).json({ message: "Error analyzing complaint" });
    }
  },

  getResolution: async (req: Request, res: Response) => {
    try {
      const { complaintId, description, category } = req.body;
      const resolution = await aiService.generateResolutionSuggestion({ description, category });
      
      if (complaintId) {
        await complaintService.updateResolutionSteps(complaintId, JSON.stringify(resolution.steps));
      }
      
      res.json(resolution);
    } catch (error) {
      console.error("AI Resolution Controller Error:", error);
      res.status(500).json({ message: "Error generating resolution" });
    }
  },

  detectAnomaly: async (req: Request, res: Response) => {
    try {
      const { recentComplaints } = req.body;
      const result = await aiService.detectAnomaly(recentComplaints || []);
      res.json(result);
    } catch (error) {
      console.error("AI Anomaly Detection Controller Error:", error);
      res.status(500).json({ message: "Error detecting anomaly" });
    }
  }
};
