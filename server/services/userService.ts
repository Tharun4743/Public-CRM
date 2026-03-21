import { User, UserRole } from "../../src/types.ts";
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.ts';

export const userService = {
  register: async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser: User = {
      ...userData,
      id: `USR-${uuidv4().slice(0, 8).toUpperCase()}`,
      isVerified: userData.role === UserRole.ADMIN ? true : false,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      isApproved: userData.role === UserRole.ADMIN ? true : false,
    };

    const stmt = db.prepare(`
        INSERT INTO users (id, name, email, password, role, department, isVerified, verificationCode, isApproved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newUser.id,
      newUser.name,
      newUser.email,
      newUser.password || null,
      newUser.role,
      newUser.department || null,
      newUser.isVerified ? 1 : 0,
      newUser.verificationCode || null,
      newUser.isApproved ? 1 : 0
    );

    return newUser;
  },

  findByEmail: async (email: string): Promise<User | undefined> => {
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
    if (!user) return undefined;
    return {
      ...user,
      isVerified: !!user.isVerified,
      isApproved: !!user.isApproved
    };
  },

  verifyUser: async (email: string, code: string): Promise<boolean> => {
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
    if (user && user.verificationCode === code) {
      db.prepare('UPDATE users SET isVerified = 1, verificationCode = NULL WHERE id = ?').run(user.id);
      return true;
    }
    return false;
  },

  updateVerificationCode: async (email: string, code: string): Promise<void> => {
    db.prepare('UPDATE users SET verificationCode = ? WHERE LOWER(email) = LOWER(?)').run(code, email);
  },

  getAll: async (): Promise<User[]> => {
    const users = db.prepare('SELECT * FROM users').all() as any[];
    return users.map(u => ({
      ...u,
      isVerified: !!u.isVerified,
      isApproved: !!u.isApproved
    }));
  }
};

