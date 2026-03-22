import cron from 'node-cron';
import { Complaint } from '../models/Complaint.ts';
import { SLARule, Escalation } from '../models/Reporting.ts';
import { User } from '../models/User.ts';
import { emailService } from './emailService.ts';
import { notificationService } from './notificationService.ts';
import { anomalyService } from './anomalyService.ts';
import { ComplaintStatus } from '../../src/types.ts';

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
    
    const complaints = await Complaint.find({
      status: { $nin: [ComplaintStatus.RESOLVED, 'Closed'] }
    });

    for (const complaint of complaints) {
      const rule = await SLARule.findOne({
        is_active: true,
        $and: [
          { $or: [{ category: complaint.category }, { category: null }] },
          { $or: [{ priority: complaint.priority }, { priority: null }] }
        ]
      }).sort({ category: -1, priority: -1 }).lean();

      const deadline = new Date(complaint.sla_deadline || "");
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
        complaint.sla_status = updatedStatus;
        await complaint.save();
        
        if (updatedStatus === 'Breached') {
          await notificationService.create(null, complaint._id.toString(), 'sla_breach', `SLA for complaint ${complaint._id} has been BREACHED.`);
        } else if (updatedStatus === 'At Risk') {
          await notificationService.create(null, complaint._id.toString(), 'sla_breach', `SLA for complaint ${complaint._id} is now AT RISK (less than 2h remaining).`);
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

    const lastEscalation = await Escalation.findOne({ complaint_id: complaint._id })
      .sort({ escalated_at: -1 })
      .lean();

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
        const officer = await User.findOne({ role: 'Officer', department: complaint.department }).lean();
        recipientEmail = officer?.email || 'dept-head@ps-crm.gov';
        reason = `Complaint ${complaint._id} initial SLA deadline (${complaint.sla_deadline}) has been breached. Initial escalation triggered.`;
      } else if (nextLevel === 2) {
        recipientEmail = 'admin@ps-crm.gov';
        reason = `Complaint ${complaint._id} remains unresolved 2 hours after Department Head notification. High-level administrative oversight required.`;
      } else if (nextLevel === 3) {
        recipientEmail = 'commissioner@ps-crm.gov';
        reason = `CRITICAL: Complaint ${complaint._id} has reached Commissioner level attention due to persistent lack of resolution for over 4 hours past breach.`;
      }

      await Escalation.create({
        complaint_id: complaint._id,
        escalated_at: now,
        escalation_level: nextLevel,
        reason,
        notified_email: recipientEmail
      });

      complaint.escalation_level = nextLevel;
      await complaint.save();

      await emailService.sendEscalationEmail(recipientEmail, complaint._id.toString(), nextLevel, reason);
      await notificationService.create(null, complaint._id.toString(), 'escalation', `Complaint ${complaint._id} has been ESCALATED to Level ${nextLevel}. Reason: ${reason}`);
    }
  }
};
