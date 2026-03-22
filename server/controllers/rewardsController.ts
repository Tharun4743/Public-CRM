import { Request, Response } from "express";
import { Citizen } from "../models/Citizen.ts";
import { PointHistory, VoucherType, Voucher } from "../models/Reward.ts";
import { rewardsService } from "../services/rewardsService.ts";
import { emailService } from "../services/emailService.ts";

export const rewardsController = {
  getSummary: async (req: Request, res: Response) => {
    try {
      const citizenId = (req as any).citizen?.id;
      const citizen = await Citizen.findById(citizenId).lean();
      if (!citizen) return res.status(404).json({ message: "Citizen not found" });

      res.json({
        totalPoints: citizen.total_points,
        totalComplaints: citizen.total_complaints,
        badges: citizen.badges,
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
      const history = await PointHistory.find({ citizen_id: citizenId }).sort({ created_at: -1 }).limit(10).lean();
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
      const vouchers = await Voucher.find({ citizen_id: citizenId }).sort({ created_at: -1 }).lean();
      res.json(vouchers);
    } catch (error) {
       res.status(500).json({ message: "Error fetching your vouchers" });
    }
  },

  getLeaderboard: async (_req: Request, res: Response) => {
    try {
      const top = await Citizen.find().sort({ total_points: -1 }).limit(10).select('name total_points').lean();

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
        await VoucherType.create({
            title,
            description,
            points_required,
            total_available
        });
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error creating voucher type" });
    }
  },

  getAllRedeemedVouchers: async (_req: Request, res: Response) => {
      try {
          const vouchers = await Voucher.find().populate('citizen_id', 'name').sort({ created_at: -1 }).lean();
          res.json(vouchers.map((v: any) => ({
              ...v,
              citizenName: v.citizen_id?.name
          })));
      } catch (error) {
          res.status(500).json({ message: "Error fetching redeems" });
      }
  }
};
