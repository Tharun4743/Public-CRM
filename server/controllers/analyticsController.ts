import { Request, Response } from "express";
import db from "../db/database.ts";

export const analyticsController = {
  getOverview: async (req: Request, res: Response) => {
    try {
      const statusCounts = db.prepare("SELECT status, COUNT(*) as count FROM complaints GROUP BY status").all() as any[];
      const categoryCounts = db.prepare("SELECT category, COUNT(*) as count FROM complaints GROUP BY category").all() as any[];
      const priorityCounts = db.prepare("SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority").all() as any[];
      const departmentCounts = db.prepare("SELECT department, COUNT(*) as count FROM complaints GROUP BY department").all() as any[];
      
      const totalComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints").get() as any;
      const resolvedComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'Resolved'").get() as any;

      res.json({
        total: totalComplaints.count,
        resolvedRate: totalComplaints.count > 0 ? (resolvedComplaints.count / totalComplaints.count) * 100 : 0,
        status: statusCounts,
        category: categoryCounts,
        priority: priorityCounts,
        department: departmentCounts
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics overview" });
    }
  },

  getTrends: async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = db.prepare(`
        SELECT date(createdAt) as date, COUNT(*) as count 
        FROM complaints 
        WHERE createdAt >= date('now', ?)
        GROUP BY date(createdAt)
        ORDER BY date ASC
      `).all(`-${days} days`) as any[];

      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trends" });
    }
  },

  getPerformance: async (req: Request, res: Response) => {
    try {
      // AVG resolution time in days
      const performance = db.prepare(`
        SELECT 
          department,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
          AVG(CASE WHEN status = 'Resolved' THEN (julianday(updatedAt) - julianday(createdAt)) ELSE NULL END) as avgDays,
          (SUM(CASE WHEN sla_status != 'Breached' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as slaCompliance,
          AVG(sentiment_score) as avgSentiment,
          AVG(satisfaction_score) as avgSatisfaction
        FROM complaints
        GROUP BY department
      `).all() as any[];

      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching performance stats" });
    }
  },

  getSentiment: async (req: Request, res: Response) => {
    try {
      const sentimentTrends = db.prepare(`
        SELECT 
          department,
          strftime('%Y-%W', createdAt) as week,
          AVG(sentiment_score) as avgSentiment
        FROM complaints
        WHERE sentiment_score IS NOT NULL
        GROUP BY department, week
        ORDER BY week ASC
      `).all() as any[];

      res.json(sentimentTrends);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sentiment trends" });
    }
  }
};
