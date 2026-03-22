import { Router } from 'express';
import { Complaint } from '../models/Complaint.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { department: { $ne: null } } },
      {
        $group: {
          _id: "$department",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
          compliantCount: { $sum: { $cond: [{ $ne: ["$sla_status", "Breached"] }, 1, 0] } },
          satisfaction: { $avg: "$satisfaction_score" },
          avgDays: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ["$status", "Resolved"] }, { $ne: ["$resolved_at", null] }] },
                { $divide: [{ $subtract: ["$resolved_at", "$createdAt"] }, 1000 * 60 * 60 * 24] },
                null
              ]
            }
          }
        }
      }
    ]);

    const results = stats.map((r, idx) => {
      const resolutionRate = r.total ? (r.resolved * 100) / r.total : 0;
      const slaRate = r.total ? (r.compliantCount * 100) / r.total : 0;
      const satisfaction = r.satisfaction || 0;
      const speedScore = Math.max(0, 100 - (Number(r.avgDays || 0) * 10));
      
      const score = resolutionRate * 0.4 + slaRate * 0.3 + satisfaction * 0.2 + speedScore * 0.1;
      
      return {
        department: r._id,
        score: Number(score.toFixed(2)),
        resolutionRate: Number(resolutionRate.toFixed(2)),
        slaRate: Number(slaRate.toFixed(2)),
        satisfaction: Number(satisfaction.toFixed(2)),
        speedScore: Number(speedScore.toFixed(2))
      };
    }).sort((a, b) => b.score - a.score).map((r, idx) => ({
      ...r,
      rank: idx + 1,
      rankChange: 'same',
      tier: r.score >= 90 ? 'Gold' : r.score >= 75 ? 'Silver' : r.score >= 60 ? 'Bronze' : 'Needs Improvement'
    }));

    res.json(results);
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

export default router;
