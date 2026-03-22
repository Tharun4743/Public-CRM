import { User as UserType, UserRole } from "../../src/types.ts";
import { User } from '../models/User.ts';

export const userService = {
  register: async (userData: Omit<UserType, 'id'>): Promise<any> => {
    const isVerified = userData.role === UserRole.ADMIN;
    const isApproved = userData.role === UserRole.ADMIN;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      ...userData,
      isVerified,
      isApproved,
      verificationCode
    });

    return user.toObject();
  },

  findByEmail: async (email: string): Promise<any> => {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    return user ? user.toObject() : undefined;
  },

  verifyUser: async (email: string, code: string): Promise<boolean> => {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (user && user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();
      return true;
    }
    return false;
  },

  updateVerificationCode: async (email: string, code: string): Promise<void> => {
    await User.updateOne({ email: new RegExp(`^${email}$`, 'i') }, { verificationCode: code });
  },

  getAll: async (): Promise<any[]> => {
    const users = await User.find();
    return users.map(u => u.toObject());
  }
};
