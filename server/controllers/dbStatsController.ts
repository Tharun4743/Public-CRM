import { Request, Response } from 'express';
import db from '../db/database.ts';

export const dbStatsController = {
  getStats: async (req: Request, res: Response) => {
    try {
      const stats = {
        users: (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c,
        officers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='Officer'").get() as any).c,
        pendingOfficers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='Officer' AND isApproved=0").get() as any).c,
        admins: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='Admin'").get() as any).c,
        citizens: (db.prepare("SELECT COUNT(*) as c FROM citizens").get() as any).c,
        complaints: (db.prepare("SELECT COUNT(*) as c FROM complaints").get() as any).c,
        pendingComplaints: (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status='Pending'").get() as any).c,
        resolvedComplaints: (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status='Resolved'").get() as any).c,
        inProgressComplaints: (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status='In Progress'").get() as any).c,
        feedbackTokens: (db.prepare("SELECT COUNT(*) as c FROM feedback").get() as any).c,
        feedbackSubmitted: (db.prepare("SELECT COUNT(*) as c FROM feedback WHERE token_used=1").get() as any).c,
        auditLogs: (db.prepare("SELECT COUNT(*) as c FROM audit_log").get() as any).c,
        notifications: (db.prepare("SELECT COUNT(*) as c FROM notifications").get() as any).c,
        vouchers: (db.prepare("SELECT COUNT(*) as c FROM vouchers").get() as any).c,
        slaBreached: (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE sla_status='Breached'").get() as any).c,
        recentUsers: db.prepare("SELECT id, name, email, role, isVerified, isApproved FROM users ORDER BY rowid DESC LIMIT 10").all(),
        recentComplaints: db.prepare("SELECT id, citizenName, category, status, priority, createdAt FROM complaints ORDER BY createdAt DESC LIMIT 10").all(),
        recentCitizens: db.prepare("SELECT id, name, email, total_points, total_complaints, isVerified FROM citizens ORDER BY created_at DESC LIMIT 10").all(),
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching DB stats', error: String(error) });
    }
  }
};
