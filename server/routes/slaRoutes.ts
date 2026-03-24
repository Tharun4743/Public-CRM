import { Router } from 'express';
import { SLARule } from '../models/Reporting.ts';
import { requireAdminAuth } from '../middleware/auth.ts';

const router = Router();

router.get('/rules', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await SLARule.find().sort({ created_at: -1 }).lean();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SLA rules' });
  }
});

router.post('/rules', requireAdminAuth, async (req, res) => {
  try {
    const r = req.body;
    await SLARule.create({
      category: r.category || null,
      priority: r.priority || null,
      department: r.department || null,
      sla_hours: r.sla_hours,
      escalation_l1_hours: r.escalation_l1_hours,
      escalation_l2_hours: r.escalation_l2_hours,
      escalation_l3_hours: r.escalation_l3_hours,
      is_active: !!r.is_active,
      created_by: r.created_by || 'admin'
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Error creating SLA rule' });
  }
});

router.put('/rules/:id', requireAdminAuth, async (req, res) => {
  try {
    const r = req.body;
    await SLARule.findByIdAndUpdate(req.params.id, {
      category: r.category || null,
      priority: r.priority || null,
      department: r.department || null,
      sla_hours: r.sla_hours,
      escalation_l1_hours: r.escalation_l1_hours,
      escalation_l2_hours: r.escalation_l2_hours,
      escalation_l3_hours: r.escalation_l3_hours,
      is_active: !!r.is_active
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating SLA rule' });
  }
});

export default router;
