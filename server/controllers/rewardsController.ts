import { Request, Response } from "express";
import db from "../db/database.ts";
import { rewardsService } from "../services/rewardsService.ts";
import { emailService } from "../services/emailService.ts";

export const rewardsController = {
  getSummary: async (req: Request, res: Response) => {
    try {
      const citizenId = (req as any).citizen?.id;
      const citizen = db.prepare('SELECT total_points, total_complaints, badges FROM citizens WHERE id = ?').get(citizenId) as any;
      if (!citizen) return res.status(404).json({ message: "Citizen not found" });

      res.json({
        totalPoints: citizen.total_points,
        totalComplaints: citizen.total_complaints,
        badges: JSON.parse(citizen.badges || '[]'),
        rank: rewardsController.calculateRank(citizen.total_points)
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching rewards summary" });
    }
  },

  calculateRank: (points: number) => {
    if (points >= 1000) return 'Diamond';
    if (points >= 500) return 'Platinum';
    if (points >= 250) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  },

  getHistory: async (req: Request, res: Response) => {
    try {
      const citizenId = (req as any).citizen?.id;
      const history = db.prepare('SELECT * FROM points_history WHERE citizen_id = ? ORDER BY created_at DESC LIMIT 10').all(citizenId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching points history" });
    }
  },

  getAvailableVouchers: async (_req: Request, res: Response) => {
    try {
      const vouchers = await rewardsService.getVoucherTypes();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching available vouchers" });
    }
  },

  redeemVoucher: async (req: Request, res: Response) => {
    try {
      const citizenId = (req as any).citizen?.id;
      const { voucherTypeId } = req.body;
      const result = await rewardsService.redeemVoucher(citizenId, voucherTypeId);
      
      // Send email
      await emailService.sendVoucherEmail(result.email, result.title, result.code);

      res.json({ success: true, code: result.code, title: result.title });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  getMyVouchers: async (req: Request, res: Response) => {
    try {
      const citizenId = (req as any).citizen?.id;
      const vouchers = db.prepare('SELECT * FROM vouchers WHERE citizen_id = ? ORDER BY created_at DESC').all(citizenId);
      res.json(vouchers);
    } catch (error) {
       res.status(500).json({ message: "Error fetching your vouchers" });
    }
  },

  getLeaderboard: async (_req: Request, res: Response) => {
    try {
      const top = db.prepare(`
        SELECT name, total_points 
        FROM citizens 
        ORDER BY total_points DESC 
        LIMIT 10
      `).all() as any[];

      const leaderboard = top.map(c => {
        const names = c.name.split(' ');
        const anonymizedName = names.length > 1 
          ? `${names[0]} ${names[names.length-1].charAt(0)}.` 
          : c.name;
        return { name: anonymizedName, points: c.total_points };
      });

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  },

  // Admin methods
  createVoucherType: async (req: Request, res: Response) => {
    try {
        const { title, description, points_required, total_available } = req.body;
        const id = `VT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        db.prepare(`
            INSERT INTO voucher_types (id, title, description, points_required, total_available, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, title, description, points_required, total_available, new Date().toISOString());
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error creating voucher type" });
    }
  },

  getAllRedeemedVouchers: async (_req: Request, res: Response) => {
      try {
          const vouchers = db.prepare(`
              SELECT v.*, c.name as citizenName
              FROM vouchers v
              JOIN citizens c ON v.citizen_id = c.id
              ORDER BY v.created_at DESC
          `).all();
          res.json(vouchers);
      } catch (error) {
          res.status(500).json({ message: "Error fetching redeems" });
      }
  }
};
