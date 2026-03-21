import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

router.get('/', async (_req, res) => {
  const rows = db.prepare(`
    SELECT
      department,
      COUNT(*) as total,
      SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) as resolved,
      (SUM(CASE WHEN sla_status!='Breached' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as slaRate,
      COALESCE(AVG(satisfaction_score), 0) as satisfaction,
      COALESCE(AVG(CASE WHEN status='Resolved' THEN julianday(updatedAt)-julianday(createdAt) END), 999) as avgDays
    FROM complaints
    WHERE department IS NOT NULL
    GROUP BY department
  `).all() as any[];
  const scores = rows.map((r) => {
    const resolutionRate = r.total ? (r.resolved * 100) / r.total : 0;
    const speedScore = Math.max(0, 100 - (Number(r.avgDays || 0) * 10));
    const score = resolutionRate * 0.4 + Number(r.slaRate || 0) * 0.3 + Number(r.satisfaction || 0) * 0.2 + speedScore * 0.1;
    return {
      department: r.department,
      score: Number(score.toFixed(2)),
      resolutionRate: Number(resolutionRate.toFixed(2)),
      slaRate: Number(Number(r.slaRate || 0).toFixed(2)),
      satisfaction: Number(Number(r.satisfaction || 0).toFixed(2)),
      speedScore: Number(speedScore.toFixed(2))
    };
  }).sort((a, b) => b.score - a.score).map((r, idx) => ({
    ...r,
    rank: idx + 1,
    rankChange: 'same',
    tier: r.score >= 90 ? 'Gold' : r.score >= 75 ? 'Silver' : r.score >= 60 ? 'Bronze' : 'Needs Improvement'
  }));
  res.json(scores);
});

export default router;
