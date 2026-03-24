import { Citizen } from '../models/Citizen.ts';
import { PointHistory, VoucherType, Voucher } from '../models/Reward.ts';
import { Complaint } from '../models/Complaint.ts';

const BADGE_RULES = [
  { id: 'first_step', name: '🌱 First Step', description: 'Submitted first complaint', condition: (c: any) => c.total_complaints >= 1 },
  { id: 'active_citizen', name: '🔥 Active Citizen', description: 'Submitted 5 complaints', condition: (c: any) => c.total_complaints >= 5 },
  { id: 'community_champion', name: '💪 Community Champion', description: 'Submitted 10 complaints', condition: (c: any) => c.total_complaints >= 10 },
  { id: 'feedback_hero', name: '⭐ Feedback Hero', description: 'Submitted feedback 5 times', condition: (c: any) => c.feedback_count >= 5 },
  { id: 'evidence_expert', name: '📸 Evidence Expert', description: 'Uploaded photos on 5 complaints', condition: (c: any) => c.evidence_count >= 5 },
  { id: 'top_reporter', name: '🏆 Top Reporter', description: '500+ total points', condition: (c: any) => c.total_points >= 500 },
];

export const rewardsService = {
  awardPoints: async (citizenId: string, points: number, reason: string, complaintId?: string) => {
    if (!citizenId) return;

    try {
      // Save points history
      await PointHistory.create({
        citizen_id: citizenId,
        points,
        reason,
        complaint_id: complaintId
      });

      // Update total points and total_complaints if needed
      const updateData: any = { $inc: { total_points: points } };
      if (reason === 'Submit complaint') {
        updateData.$inc.total_complaints = 1;
      }

      await Citizen.findByIdAndUpdate(citizenId, updateData);

      await rewardsService.checkAndAwardBadges(citizenId);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  },

  checkAndAwardBadges: async (citizenId: string) => {
    const citizen = await Citizen.findById(citizenId);
    if (!citizen) return;

    const feedbackCount = await Complaint.countDocuments({ citizen_id: citizenId, feedback_submitted: true });
    const evidenceCount = await Complaint.countDocuments({ citizen_id: citizenId, complaint_image: { $exists: true, $ne: null } });

    const stats: any = {
      total_complaints: citizen.total_complaints,
      total_points: citizen.total_points,
      feedback_count: feedbackCount,
      evidence_count: evidenceCount
    };

    const newBadges = [...citizen.badges];
    let awarded = false;

    for (const rule of BADGE_RULES) {
      if (!newBadges.includes(rule.id) && rule.condition(stats)) {
        newBadges.push(rule.id);
        awarded = true;
      }
    }

    if (awarded) {
      citizen.badges = newBadges;
      await citizen.save();
    }
  },

  getVoucherTypes: async () => {
    return await VoucherType.find({ is_active: true }).lean();
  },

  redeemVoucher: async (citizenId: string, voucherTypeId: string) => {
    const voucherType = await VoucherType.findOne({ _id: voucherTypeId, is_active: true }).lean();
    if (!voucherType) throw new Error('Voucher type not found or inactive');

    const citizen = await Citizen.findById(citizenId).lean();
    if (!citizen || citizen.total_points < voucherType.points_required) {
      throw new Error('Insufficient points');
    }

    if (voucherType.total_available <= 0) {
      throw new Error('Voucher out of stock');
    }

    const code = `REWARD-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const updatedCitizen = await Citizen.findOneAndUpdate(
      { _id: citizenId, total_points: { $gte: voucherType.points_required } },
      { $inc: { total_points: -voucherType.points_required } },
      { new: true }
    );
    if (!updatedCitizen) throw new Error('Insufficient points');

    const updatedVoucherType = await VoucherType.findOneAndUpdate(
      { _id: voucherTypeId, is_active: true, total_available: { $gt: 0 } },
      { $inc: { total_available: -1 } },
      { new: true }
    );
    if (!updatedVoucherType) {
      // Compensating action when stock changes concurrently after point deduction.
      await Citizen.findByIdAndUpdate(citizenId, { $inc: { total_points: voucherType.points_required } });
      throw new Error('Voucher out of stock');
    }

    await Voucher.create({
      citizen_id: citizenId,
      code,
      title: voucherType.title,
      description: voucherType.description,
      points_required: voucherType.points_required,
      expires_at: expiry
    });

    return { code, title: voucherType.title, email: citizen.email };
  }
};
