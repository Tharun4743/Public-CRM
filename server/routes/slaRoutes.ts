import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

router.get('/rules', async (_req, res) => {
  const rows = db.prepare('SELECT * FROM sla_rules ORDER BY id DESC').all();
  res.json(rows);
});

router.post('/rules', async (req, res) => {
  const r = req.body;
  db.prepare(`
    INSERT INTO sla_rules (
      category, priority, department_id, sla_hours, escalation_l1_hours, escalation_l2_hours, escalation_l3_hours, is_active, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(r.category || null, r.priority || null, r.department_id || null, r.sla_hours, r.escalation_l1_hours, r.escalation_l2_hours, r.escalation_l3_hours, r.is_active ? 1 : 0, r.created_by || 'admin', new Date().toISOString());
  res.status(201).json({ ok: true });
});

router.put('/rules/:id', async (req, res) => {
  const r = req.body;
  db.prepare(`
    UPDATE sla_rules SET category=?, priority=?, department_id=?, sla_hours=?, escalation_l1_hours=?, escalation_l2_hours=?, escalation_l3_hours=?, is_active=?
    WHERE id=?
  `).run(r.category || null, r.priority || null, r.department_id || null, r.sla_hours, r.escalation_l1_hours, r.escalation_l2_hours, r.escalation_l3_hours, r.is_active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

export default router;
