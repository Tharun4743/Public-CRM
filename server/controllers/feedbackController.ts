import { Request, Response } from "express";
import { feedbackService } from "../services/feedbackService.ts";

export const feedbackController = {
  getComplaintByToken: async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };
      const complaint = await feedbackService.getComplaintByToken(token);
      if (!complaint) return res.status(404).json({ message: "Invalid or expired token" });
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error fetching feedback data" });
    }
  },

  submitFeedback: async (req: Request, res: Response) => {
    try {
      const { token, rating, comment } = req.body;
      const result = await feedbackService.submitFeedback(token, rating, comment);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
};
