import { Request, Response } from "express";
import { notificationService } from "../services/notificationService.ts";

export const notificationController = {
  getNotifications: async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ message: "User ID required" });
      const notifications = await notificationService.getForUser(userId as string);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  },

  markRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id);
      res.json({ message: "Marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking as read" });
    }
  },

  markAllRead: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      await notificationService.markAllAsRead(userId);
      res.json({ message: "Marked all as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking all as read" });
    }
  }
};
