import { Complaint, Feedback } from '../models/Complaint.ts';
import { emailService } from './emailService.ts';
import { notificationService } from './notificationService.ts';
import { rewardsService } from './rewardsService.ts';
import { ComplaintStatus } from '../../src/types.ts';

export const feedbackService = {
  getComplaintByToken: async (token: string) => {
    const feedback = await Feedback.findOne({ token, token_used: false });
    if (!feedback) return null;
    return await Complaint.findById(feedback.complaint_id).lean();
  },

  submitFeedback: async (token: string, rating: number, comment: string) => {
    const feedback = await Feedback.findOne({ token, token_used: false });
    if (!feedback) throw new Error('Invalid or expired token');

    const complaintId = feedback.complaint_id;
    const now = new Date();

    // 1. Mark token as used and save feedback
    feedback.token_used = true;
    feedback.rating = rating;
    feedback.comment = comment;
    feedback.submitted_at = now as any;
    await feedback.save();

    const complaint = await Complaint.findByIdAndUpdate(complaintId, {
      satisfaction_score: rating,
      feedback_submitted: true,
      updatedAt: now
    }, { new: true });

    if (!complaint) throw new Error('Complaint not found');
    
    // REWARDS: Feedback bonus
    if (complaint.citizen_id) {
        await rewardsService.awardPoints(complaint.citizen_id.toString(), 10, 'Submit feedback', complaintId?.toString());
    }

    // 3. Handle low rating (< 3 stars)
    if (rating < 3) {
      // Re-open complaint
      complaint.status = ComplaintStatus.IN_PROGRESS as any;
      await complaint.save();

      // Notify Admin
      await notificationService.create(null, complaintId?.toString(), 'alert', `NEGATIVE FEEDBACK: Complaint ${complaintId} has been re-opened due to 1/2 star rating.`);

      // Send Apology Email
      const targetEmail = complaint.citizen_email || complaint.contactInfo;
      if (targetEmail && targetEmail.includes('@')) {
        await emailService.sendApologyEmail(targetEmail, complaintId?.toString() || '');
      }

      return { success: true, message: 'Your feedback was received and we are truly sorry. Your case has been re-opened for investigation.' };
    }

    return { success: true, message: 'Thank you for your valuable feedback!' };
  }
};
