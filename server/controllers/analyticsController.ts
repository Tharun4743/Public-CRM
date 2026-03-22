import { Request, Response } from "express";
import { Complaint } from "../models/Complaint.ts";

export const analyticsController = {
  getOverview: async (req: Request, res: Response) => {
    try {
      const statusCounts = await Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
      const categoryCounts = await Complaint.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
      const priorityCounts = await Complaint.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]);
      const departmentCounts = await Complaint.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
      
      const totalCount = await Complaint.countDocuments();
      const resolvedCount = await Complaint.countDocuments({ status: 'Resolved' });

      res.json({
        total: totalCount,
        resolvedRate: totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0,
        status: statusCounts.map(s => ({ status: s._id, count: s.count })),
        category: categoryCounts.map(c => ({ category: c._id, count: c.count })),
        priority: priorityCounts.map(p => ({ priority: p._id, count: p.count })),
        department: departmentCounts.map(d => ({ department: d._id, count: d.count }))
      });
    } catch (error) {
      console.error('Analytics Error:', error);
      res.status(500).json({ message: "Error fetching analytics overview" });
    }
  },

  getTrends: async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await Complaint.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json(trends.map(t => ({ date: t._id, count: t.count })));
    } catch (error) {
      res.status(500).json({ message: "Error fetching trends" });
    }
  },

  getPerformance: async (req: Request, res: Response) => {
    try {
      const performance = await Complaint.aggregate([
        {
          $group: {
            _id: "$department",
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
            avgDays: {
              $avg: {
                $cond: [
                  { $and: [{ $eq: ["$status", "Resolved"] }, { $ne: ["$resolved_at", null] }] },
                  { $divide: [{ $subtract: ["$resolved_at", "$createdAt"] }, 1000 * 60 * 60 * 24] },
                  null
                ]
              }
            },
            compliantCount: { $sum: { $cond: [{ $ne: ["$sla_status", "Breached"] }, 1, 0] } },
            avgSentiment: { $avg: "$sentiment_score" },
            avgSatisfaction: { $avg: "$satisfaction_score" }
          }
        },
        {
          $project: {
            department: "$_id",
            total: 1,
            resolved: 1,
            avgDays: 1,
            slaCompliance: { $multiply: [{ $divide: ["$compliantCount", "$total"] }, 100] },
            avgSentiment: 1,
            avgSatisfaction: 1
          }
        }
      ]);

      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching performance stats" });
    }
  },

  getSentiment: async (req: Request, res: Response) => {
    try {
      const sentimentTrends = await Complaint.aggregate([
        { $match: { sentiment_score: { $ne: null } } },
        {
          $group: {
            _id: {
              department: "$department",
              week: { $dateToString: { format: "%Y-%U", date: "$createdAt" } }
            },
            avgSentiment: { $avg: "$sentiment_score" }
          }
        },
        { $sort: { "_id.week": 1 } },
        {
          $project: {
            department: "$_id.department",
            week: "$_id.week",
            avgSentiment: 1
          }
        }
      ]);

      res.json(sentimentTrends);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sentiment trends" });
    }
  }
};
