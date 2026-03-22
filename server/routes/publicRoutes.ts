import { Router } from 'express';
import { Complaint } from '../models/Complaint.ts';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalMonth = await Complaint.countDocuments({ createdAt: { $gte: startOfMonth } });
    const resolvedMonth = await Complaint.countDocuments({ 
        createdAt: { $gte: startOfMonth },
        status: 'Resolved'
    });

    const avgRes = await Complaint.aggregate([
        { $match: { status: 'Resolved', createdAt: { $gte: startOfMonth }, resolved_at: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgDays: { $avg: { $divide: [{ $subtract: ["$resolved_at", "$createdAt"] }, 1000 * 60 * 60 * 24] } }
          }
        }
    ]);

    const topIssues = await Complaint.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { category: "$_id", count: 1, _id: 0 } }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const volume = await Complaint.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } }
    ]);

    const departmentSummary = await Complaint.aggregate([
        {
            $group: {
              _id: "$department",
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } }
            }
        },
        { $project: { department: "$_id", total: 1, resolved: 1, _id: 0 } }
    ]);

    res.json({
        totalComplaintsMonth: totalMonth,
        resolutionRateMonth: totalMonth ? (resolvedMonth * 100) / totalMonth : 0,
        averageResolutionTime: avgRes[0]?.avgDays || 0,
        topIssues,
        departmentSummary,
        volume
    });
  } catch (error) {
    console.error('Public Stats Error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

router.get('/recent-resolutions', async (_req, res) => {
  try {
    const rows = await Complaint.find({ status: 'Resolved' })
        .sort({ resolved_at: -1 })
        .limit(10)
        .select('category status createdAt resolved_at')
        .lean();

    res.json(rows.map((r: any) => ({
        category: r.category,
        resolutionTimeDays: Math.max(0, Number(((new Date(r.resolved_at).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(2)))
    })));
  } catch (error) {
      res.status(500).json({ message: 'Error fetching recent resolutions' });
  }
});

export default router;
