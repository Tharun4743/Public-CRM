import { Request, Response } from "express";
import { notificationService } from "../services/notificationService.ts";
import { AuthenticatedRequest } from "../middleware/auth.ts";

export const notificationController = {
  getNotifications: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.citizen?.id;
      if (!userId) return res.status(400).json({ message: "User ID required" });
      const notifications = await notificationService.getForUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  },

  markRead: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id);
      res.json({ message: "Marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking as read" });
    }
  },

  markAllRead: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.citizen?.id;
      if (!userId) return res.status(400).json({ message: "User ID required" });
      await notificationService.markAllAsRead(userId);
      res.json({ message: "Marked all as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking all as read" });
    }
  }
};
