import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { User } from '../types';
import { getPortalAuthHeaders, getPortalUser } from '../utils/portalAuth';

interface Notification {
  id: string;
  user_id: string | null;
  complaint_id: string | null;
  type: 'status_change' | 'assignment' | 'sla_breach' | 'escalation' | 'alert';
  message: string;
  is_read: number;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const user: User | null = getPortalUser();

  useEffect(() => {
    if (!user) return;

    const socket = io({ auth: { token: (user as any)?.token } });

    socket.on('connect', () => {
      socket.emit('join-room', user.id);
      if (user.role === 'Admin') {
        socket.emit('join-room', 'Admin');
      }
    });

    socket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
    });

    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user || !user.id) return;
    try {
      const res = await fetch(`/api/notifications`, { headers: getPortalAuthHeaders() });
      if (!res.ok) {
        console.error('Failed to fetch notifications:', res.status);
        return;
      }
      const data = await res.json();
      // Ensure data is an array
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]); // Reset to empty array on error
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: getPortalAuthHeaders() });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {}
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await fetch(`/api/notifications/read-all`, { method: 'PATCH', headers: getPortalAuthHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {}
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => n.is_read === 0 || (n as any).is_read === false).length : 0;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
