import cron from 'node-cron';
import db from '../db/database.ts';
import { emailService } from './emailService.ts';
import { notificationService } from './notificationService.ts';
import { anomalyService } from './anomalyService.ts';
import { ComplaintStatus } from '../../src/types.ts';
import { v4 as uuidv4 } from 'uuid';

export const slaService = {
  startSlaMonitoring: () => {
    console.log('SLA & Anomaly Monitoring Engine Started');
    
    // Every 15 minutes for SLA
    cron.schedule('*/15 * * * *', async () => {
      console.log(`[SLA] Running tracking job at ${new Date().toISOString()}`);
      await slaService.processSlaTracking();
    });

    // Every hour for Anomaly Detection
    cron.schedule('0 * * * *', async () => {
      console.log(`[ANOMALY] Running detection at ${new Date().toISOString()}`);
      await anomalyService.detectAnomalies();
    });
  },

  processSlaTracking: async () => {
    const now = new Date();
    
    const complaints = db.prepare(`
      SELECT * FROM complaints 
      WHERE status != ? AND status != ?
    `).all(ComplaintStatus.RESOLVED, 'Closed') as any[];

    for (const complaint of complaints) {
      const rule = db.prepare(`
        SELECT * FROM sla_rules
        WHERE is_active = 1
          AND (category = ? OR category IS NULL)
          AND (priority = ? OR priority IS NULL)
        ORDER BY
          CASE WHEN category IS NOT NULL THEN 1 ELSE 0 END DESC,
          CASE WHEN priority IS NOT NULL THEN 1 ELSE 0 END DESC
        LIMIT 1
      `).get(complaint.category || null, complaint.priority || null) as any;
      const deadline = new Date(complaint.sla_deadline);
      const diffMs = deadline.getTime() - now.getTime();
      let updatedStatus = complaint.sla_status;

      if (diffMs < 0) {
        updatedStatus = 'Breached';
      } else if (diffMs < 2 * 60 * 60 * 1000) {
        updatedStatus = 'At Risk';
      } else {
        updatedStatus = 'On Track';
      }

      if (updatedStatus !== complaint.sla_status) {
        db.prepare('UPDATE complaints SET sla_status = ? WHERE id = ?')
          .run(updatedStatus, complaint.id);
        
        if (updatedStatus === 'Breached') {
          await notificationService.create(null, complaint.id, 'sla_breach', `SLA for complaint ${complaint.id} has been BREACHED.`);
        } else if (updatedStatus === 'At Risk') {
          await notificationService.create(null, complaint.id, 'sla_breach', `SLA for complaint ${complaint.id} is now AT RISK (less than 2h remaining).`);
        }
      }

      if (updatedStatus === 'Breached') {
        await slaService.handleEscalation(complaint, rule);
      }
    }
  },

  handleEscalation: async (complaint: any, rule: any) => {
    const now = new Date();
    const currentLevel = complaint.escalation_level;

    const lastEscalation = db.prepare(`
      SELECT * FROM escalations 
      WHERE complaint_id = ? 
      ORDER BY escalated_at DESC 
      LIMIT 1
    `).get(complaint.id) as any;

    let shouldEscalate = false;
    let nextLevel = 0;
    
    if (currentLevel === 0) {
      shouldEscalate = true;
      nextLevel = 1;
    } else if (currentLevel < 3) {
      if (lastEscalation) {
        const lastTime = new Date(lastEscalation.escalated_at);
        const hoursSince = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
        const threshold = currentLevel === 1 ? (rule?.escalation_l2_hours || 2) : (rule?.escalation_l3_hours || 4);
        if (hoursSince >= threshold) {
          shouldEscalate = true;
          nextLevel = currentLevel + 1;
        }
      }
    }

    if (shouldEscalate) {
      let recipientEmail = 'admin@ps-crm.gov';
      let reason = `Resolution failed within Level ${currentLevel} oversight period.`;
      
      if (nextLevel === 1) {
        const officer = db.prepare('SELECT email FROM users WHERE role = ? AND department = ?').get('Officer', complaint.department) as any;
        recipientEmail = officer?.email || 'dept-head@ps-crm.gov';
        reason = `Complaint ${complaint.id} initial SLA deadline (${complaint.sla_deadline}) has been breached. Initial escalation triggered.`;
      } else if (nextLevel === 2) {
        recipientEmail = 'admin@ps-crm.gov';
        reason = `Complaint ${complaint.id} remains unresolved 2 hours after Department Head notification. High-level administrative oversight required.`;
      } else if (nextLevel === 3) {
        recipientEmail = 'commissioner@ps-crm.gov';
        reason = `CRITICAL: Complaint ${complaint.id} has reached Commissioner level attention due to persistent lack of resolution for over 4 hours past breach.`;
      }

      const escalationId = `ESC-${uuidv4().substring(0, 8).toUpperCase()}`;
      db.prepare(`
        INSERT INTO escalations (id, complaint_id, escalated_at, escalation_level, reason, notified_email)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(escalationId, complaint.id, now.toISOString(), nextLevel, reason, recipientEmail);

      db.prepare('UPDATE complaints SET escalation_level = ? WHERE id = ?').run(nextLevel, complaint.id);
      await emailService.sendEscalationEmail(recipientEmail, complaint.id, nextLevel, reason);
      await notificationService.create(null, complaint.id, 'escalation', `Complaint ${complaint.id} has been ESCALATED to Level ${nextLevel}. Reason: ${reason}`);
    }
  }
};
