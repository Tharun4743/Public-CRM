import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

router.get('/stats', async (_req, res) => {
  const totalMonth = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE createdAt >= date('now','start of month')").get() as any;
  const resolvedMonth = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE createdAt >= date('now','start of month') AND status='Resolved'").get() as any;
  const avgDays = db.prepare("SELECT AVG(julianday(updatedAt)-julianday(createdAt)) as avgDays FROM complaints WHERE status='Resolved' AND createdAt >= date('now','start of month')").get() as any;
  const topIssues = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM complaints
    WHERE createdAt >= date('now','start of month')
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5
  `).all();
  const volume = db.prepare(`
    SELECT date(createdAt) as date, COUNT(*) as count
    FROM complaints
    WHERE createdAt >= date('now','-30 days')
    GROUP BY date(createdAt)
    ORDER BY date ASC
  `).all();
  const departmentSummary = db.prepare(`
    SELECT department, COUNT(*) as total, SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) as resolved
    FROM complaints
    GROUP BY department
  `).all();
  res.json({
    totalComplaintsMonth: totalMonth.count,
    resolutionRateMonth: totalMonth.count ? (resolvedMonth.count * 100) / totalMonth.count : 0,
    averageResolutionTime: avgDays.avgDays || 0,
    topIssues,
    departmentSummary,
    volume
  });
});

router.get('/recent-resolutions', async (_req, res) => {
  const rows = db.prepare(`
    SELECT category, status, createdAt, updatedAt
    FROM complaints
    WHERE status='Resolved'
    ORDER BY updatedAt DESC
    LIMIT 10
  `).all();
  res.json(rows.map((r: any) => ({
    category: r.category,
    resolutionTimeDays: Math.max(0, Number(((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(2)))
  })));
});

export default router;
