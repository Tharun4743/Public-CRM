import db from "../db/database.ts";
import { io } from "../../server.ts";
import { v4 as uuidv4 } from 'uuid';

export const notificationService = {
  create: async (userId: string | null, complaintId: string | null, type: string, message: string) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO notifications (id, user_id, complaint_id, type, message, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, complaintId, type, message, 0, createdAt);

    const notification = { id, user_id: userId, complaint_id: complaintId, type, message, is_read: 0, created_at: createdAt };

    // Emit to specific users/room
    if (userId) {
      io.to(userId).emit("notification", notification);
    }
    
    if (complaintId) {
       io.to(complaintId).emit("notification", notification);
    }

    // Admins always get notifications
    io.to("Admin").emit("notification", notification);

    return notification;
  },

  getForUser: async (userId: string) => {
    // Get notifications for user or where they are an admin
    return db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId) as any[];
  },

  markAsRead: async (id: string) => {
    return db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
  },

  markAllAsRead: async (userId: string) => {
    return db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL").run(userId);
  }
};
