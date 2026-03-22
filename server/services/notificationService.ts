import { Notification } from '../models/System.ts';
import { io } from "../socket.ts";

export const notificationService = {
  create: async (userId: string | null, complaintId: string | null, type: string, message: string) => {
    const notification = await Notification.create({
      user_id: userId,
      complaint_id: complaintId,
      type,
      message,
      is_read: false
    });

    const notificationObj = notification.toObject();

    // Emit to specific users/room
    if (userId) {
      io.to(userId).emit("notification", notificationObj);
    }
    
    if (complaintId) {
       io.to(complaintId).emit("notification", notificationObj);
    }

    // Admins always get notifications
    io.to("Admin").emit("notification", notificationObj);

    return notificationObj;
  },

  getForUser: async (userId: string) => {
    return await Notification.find({
      $or: [{ user_id: userId }, { user_id: null }]
    }).sort({ createdAt: -1 }).limit(50).lean();
  },

  markAsRead: async (id: string) => {
    await Notification.findByIdAndUpdate(id, { is_read: true });
  },

  markAllAsRead: async (userId: string) => {
    await Notification.updateMany(
      { $or: [{ user_id: userId }, { user_id: null }] },
      { is_read: true }
    );
  }
};
