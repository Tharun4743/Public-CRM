import db from '../db/database.ts';
import { emailService } from './emailService.ts';
import { notificationService } from './notificationService.ts';
import { rewardsService } from './rewardsService.ts';
import { ComplaintStatus } from '../../src/types.ts';

export const feedbackService = {
  getComplaintByToken: async (token: string) => {
    const feedback = db.prepare('SELECT * FROM feedback WHERE token = ? AND token_used = 0').get(token) as any;
    if (!feedback) return null;
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(feedback.complaint_id) as any;
  },

  submitFeedback: async (token: string, rating: number, comment: string) => {
    const feedback = db.prepare('SELECT * FROM feedback WHERE token = ? AND token_used = 0').get(token) as any;
    if (!feedback) throw new Error('Invalid or expired token');

    const complaintId = feedback.complaint_id;
    const now = new Date().toISOString();

    // 1. Mark token as used and save feedback
    db.prepare(`
      UPDATE feedback 
      SET token_used = 1, rating = ?, comment = ?, submitted_at = ? 
      WHERE id = ?
    `).run(rating, comment, now, feedback.id);

    db.prepare(`
      UPDATE complaints 
      SET satisfaction_score = ?, feedback_submitted = 1 
      WHERE id = ?
    `).run(rating, complaintId);

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId) as any;
    
    // REWARDS: Feedback bonus
    if (complaint.citizen_id) {
        await rewardsService.awardPoints(complaint.citizen_id, 10, 'Submit feedback', complaintId);
    }

    // 3. Handle low rating (< 3 stars)
    if (rating < 3) {
      // Re-open complaint
      db.prepare("UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?")
        .run(ComplaintStatus.IN_PROGRESS, now, complaintId);

      // Notify Admin
      await notificationService.create(null, complaintId, 'alert', `NEGATIVE FEEDBACK: Complaint ${complaintId} has been re-opened due to 1/2 star rating.`);

      // Send Apology Email
      if (complaint.contactInfo && complaint.contactInfo.includes('@')) {
        await emailService.sendApologyEmail(complaint.contactInfo, complaintId);
      }

      return { success: true, message: 'Your feedback was received and we are truly sorry. Your case has been re-opened for investigation.' };
    }

    return { success: true, message: 'Thank you for your valuable feedback!' };
  }
};
