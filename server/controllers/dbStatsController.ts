import { Request, Response } from 'express';
import { User } from '../models/User.ts';
import { Citizen } from '../models/Citizen.ts';
import { Complaint, Feedback } from '../models/Complaint.ts';
import { AuditLog, Notification } from '../models/System.ts';
import { Voucher } from '../models/Reward.ts';

export const dbStatsController = {
  getStats: async (req: Request, res: Response) => {
    try {
      const stats = {
        users: await User.countDocuments(),
        officers: await User.countDocuments({ role: 'Officer' }),
        pendingOfficers: await User.countDocuments({ role: 'Officer', isApproved: false }),
        admins: await User.countDocuments({ role: 'Admin' }),
        citizens: await Citizen.countDocuments(),
        complaints: await Complaint.countDocuments(),
        pendingComplaints: await Complaint.countDocuments({ status: 'Pending' }),
        resolvedComplaints: await Complaint.countDocuments({ status: 'Resolved' }),
        inProgressComplaints: await Complaint.countDocuments({ status: 'In Progress' }),
        feedbackTokens: await Feedback.countDocuments(),
        feedbackSubmitted: await Feedback.countDocuments({ token_used: true }),
        auditLogs: await AuditLog.countDocuments(),
        notifications: await Notification.countDocuments(),
        vouchers: await Voucher.countDocuments(),
        slaBreached: await Complaint.countDocuments({ sla_status: 'Breached' }),
        recentUsers: await User.find().sort({ createdAt: -1 }).limit(10).lean(),
        recentComplaints: await Complaint.find().sort({ createdAt: -1 }).limit(10).lean(),
        recentCitizens: await Citizen.find().sort({ createdAt: -1 }).limit(10).lean(),
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching DB stats', error: String(error) });
    }
  }
};
