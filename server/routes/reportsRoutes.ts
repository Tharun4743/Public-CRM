import { Router } from 'express';
import { Complaint } from '../models/Complaint.ts';
import { ReportConfig, ScheduledReport } from '../models/Reporting.ts';
import { requireAdminAuth } from '../middleware/auth.ts';

const router = Router();

const DIMENSION_MAP: Record<string, any> = {
  Department: '$department',
  Category: '$category',
  Priority: '$priority',
  Status: '$status',
  // Complaint documents do not have a dedicated ward field.
  Ward: '$address',
  Source: '$source',
  Month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
};

router.post('/generate', requireAdminAuth, async (req, res) => {
  try {
    const { dimensions = [], metrics = ['Count'], dateFrom, dateTo } = req.body;
    
    const match: any = {};
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
    }

    const group: any = { _id: {} };
    dimensions.forEach((d: string) => {
      group._id[d] = DIMENSION_MAP[d];
    });

    if (metrics.includes('Count')) {
      group.count = { $sum: 1 };
    }
    if (metrics.includes('Avg Resolution Days')) {
      group.avg_resolution_days = {
        $avg: {
          $cond: [
            { $and: [{ $eq: ["$status", "Resolved"] }, { $ne: ["$resolved_at", null] }] },
            { $divide: [{ $subtract: ["$resolved_at", "$createdAt"] }, 1000 * 60 * 60 * 24] },
            null
          ]
        }
      };
    }
    if (metrics.includes('SLA Compliance %')) {
      group.compliant_count = { $sum: { $cond: [{ $ne: ["$sla_status", "Breached"] }, 1, 0] } };
      group.total_for_sla = { $sum: 1 };
    }
    if (metrics.includes('Avg Satisfaction')) {
      group.avg_satisfaction = { $avg: "$satisfaction_score" };
    }
    if (metrics.includes('Escalation Count')) {
      group.escalation_count = { $sum: { $cond: [{ $gt: ["$escalation_level", 0] }, 1, 0] } };
    }

    const pipeline: any[] = [{ $match: match }];
    if (dimensions.length > 0) {
      pipeline.push({ $group: group });
      if (metrics.includes('SLA Compliance %')) {
        pipeline.push({
          $project: {
            _id: 1,
            count: 1,
            avg_resolution_days: 1,
            avg_satisfaction: 1,
            escalation_count: 1,
            sla_compliance_pct: { $multiply: [{ $divide: ["$compliant_count", "$total_for_sla"] }, 100] }
          }
        });
      }
    } else {
        // No dimensions, just global metrics
        pipeline.push({ $group: { ...group, _id: null } });
    }

    const results = await Complaint.aggregate(pipeline);
    
    const rows = results.map(r => {
        const row: any = {};
        dimensions.forEach((d: string) => {
            row[d] = r._id[d];
        });
        metrics.forEach((m: string) => {
            if (m === 'Count') row[m] = r.count;
            if (m === 'Avg Resolution Days') row[m] = r.avg_resolution_days;
            if (m === 'SLA Compliance %') row[m] = r.sla_compliance_pct;
            if (m === 'Avg Satisfaction') row[m] = r.avg_satisfaction;
            if (m === 'Escalation Count') row[m] = r.escalation_count;
        });
        return row;
    });

    res.json({ columns: [...dimensions, ...metrics], rows });
  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

router.post('/config', requireAdminAuth, async (req, res) => {
  try {
    const { name, dimensions, metrics, createdBy } = req.body;
    const config = await ReportConfig.create({
      name,
      dimensions: JSON.stringify(dimensions || []),
      metrics: JSON.stringify(metrics || []),
      created_by: createdBy || 'admin'
    });
    res.status(201).json({ id: config._id });
  } catch (error) {
    res.status(500).json({ message: 'Error saving config' });
  }
});

router.get('/config', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await ReportConfig.find().sort({ created_at: -1 }).lean();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching configs' });
  }
});

router.post('/schedule', requireAdminAuth, async (req, res) => {
  try {
    const { configId, frequency, recipients } = req.body;
    await ScheduledReport.create({
      config_id: configId,
      frequency,
      recipients: JSON.stringify(recipients || []),
      next_run_at: new Date()
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling report' });
  }
});

router.get('/schedule', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await ScheduledReport.find().sort({ _id: -1 }).lean();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules' });
  }
});

export default router;
