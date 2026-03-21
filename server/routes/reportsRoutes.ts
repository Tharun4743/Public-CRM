import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

const DIMENSION_MAP: Record<string, string> = {
  Department: 'department',
  Category: 'category',
  Priority: 'priority',
  Status: 'status',
  Ward: "COALESCE((SELECT ward FROM citizens WHERE citizens.id = complaints.citizen_id), 'Unknown')",
  Source: 'source',
  Month: "strftime('%Y-%m', createdAt)"
};
const METRIC_MAP: Record<string, string> = {
  Count: 'COUNT(*) as count',
  'Avg Resolution Days': "AVG(CASE WHEN status='Resolved' THEN julianday(updatedAt)-julianday(createdAt) END) as avg_resolution_days",
  'SLA Compliance %': "(SUM(CASE WHEN sla_status!='Breached' THEN 1 ELSE 0 END)*100.0/COUNT(*)) as sla_compliance_pct",
  'Avg Satisfaction': 'AVG(satisfaction_score) as avg_satisfaction',
  'Escalation Count': 'SUM(CASE WHEN escalation_level > 0 THEN 1 ELSE 0 END) as escalation_count'
};

router.post('/generate', async (req, res) => {
  const { dimensions = [], metrics = ['Count'], dateFrom, dateTo } = req.body;
  const cols = dimensions.map((d: string) => `${DIMENSION_MAP[d]} as "${d}"`).filter(Boolean);
  const mets = metrics.map((m: string) => METRIC_MAP[m]).filter(Boolean);
  const selectSql = [...cols, ...mets].join(', ');
  if (!selectSql) return res.status(400).json({ message: 'Invalid configuration' });
  let sql = `SELECT ${selectSql} FROM complaints WHERE 1=1`;
  const params: any[] = [];
  if (dateFrom) { sql += ' AND createdAt >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND createdAt <= ?'; params.push(dateTo); }
  if (cols.length) sql += ` GROUP BY ${dimensions.map((d: string) => DIMENSION_MAP[d]).join(', ')}`;
  const rows = db.prepare(sql).all(...params);
  res.json({ columns: [...dimensions, ...metrics], rows });
});

router.post('/config', async (req, res) => {
  const { name, dimensions, metrics, createdBy } = req.body;
  const result = db.prepare(`
    INSERT INTO report_configs (name, dimensions, metrics, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, JSON.stringify(dimensions || []), JSON.stringify(metrics || []), createdBy || 'admin', new Date().toISOString());
  res.status(201).json({ id: result.lastInsertRowid });
});

router.get('/config', async (_req, res) => {
  const rows = db.prepare('SELECT * FROM report_configs ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/schedule', async (req, res) => {
  const { configId, frequency, recipients } = req.body;
  db.prepare(`
    INSERT INTO scheduled_reports (config_id, frequency, recipients, next_run_at, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(configId, frequency, JSON.stringify(recipients || []), new Date().toISOString());
  res.status(201).json({ ok: true });
});

router.get('/schedule', async (_req, res) => {
  const rows = db.prepare('SELECT * FROM scheduled_reports ORDER BY id DESC').all();
  res.json(rows);
});

export default router;
