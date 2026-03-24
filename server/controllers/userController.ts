import { Request, Response } from "express";
import { userService } from "../services/userService.ts";
import { emailService } from "../services/emailService.ts";
import { UserRole } from "../../src/types.ts";
import { User } from "../models/User.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const userController = {
  register: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { name, password, role, department } = req.body;
      
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing Name, Email, Password, or Role" });
      }

      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const adminRegistrationSecret = process.env.ADMIN_REGISTRATION_SECRET;
      if (role === UserRole.ADMIN && adminRegistrationSecret && req.body.adminSecret !== adminRegistrationSecret) {
        return res.status(403).json({ message: "Invalid Admin authorization password" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpiry = new Date(Date.now() + 5 * 60 * 1000); 

      const user = await userService.register({
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        department,
        verificationCode,
        verificationExpiry
      });

      const emailRes = await emailService.sendVerificationEmail(email, verificationCode);
      if (!emailRes.success) {
        // Return 503 so user knows the server failed to deliver the mandatory email
        return res.status(503).json({ message: "Failed to send verification email. Please try again later." });
      }

      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = (user as any).toObject ? (user as any).toObject() : user;
      res.status(201).json({
        ...userWithoutSensitiveData,
        message: "Verification code sent to your email."
      });
    } catch (error: any) {
      if (error.code === 11000) return res.status(409).json({ message: "Email already exists." });
      res.status(500).json({ message: "Internal server error." });
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { code } = req.body;
      const user = await User.findOne({ email });
      if (!user || user.verificationCode !== code) return res.status(400).json({ message: "Invalid code" });
      if (user.verificationExpiry && user.verificationExpiry < new Date()) {
          return res.status(400).json({ message: "Expired OTP." });
      }
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationExpiry = undefined;
      await user.save();
      res.status(200).json({ message: "Email verified." });
    } catch (error) {
      res.status(500).json({ message: "Verification failed." });
    }
  },

  resendCode: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = newCode;
      user.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      
      const emailRes = await emailService.sendVerificationEmail(email, newCode);
      if (!emailRes.success) return res.status(503).json({ message: "Email failed." });
      res.status(200).json({ message: "Code sent." });
    } catch (error) {
      res.status(500).json({ message: "Resend failed." });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { password, role } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: "Invalid email or password." });

      const isValid = await bcrypt.compare(password, user.password || '');
      if (!isValid || user.role !== role) return res.status(401).json({ message: "Invalid credentials." });

      if (user.isVerified === false) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = newCode;
        user.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        
        const emailRes = await emailService.sendVerificationEmail(email, newCode);
        return res.status(403).json({ 
          message: emailRes.success ? "Account not verified. A new code was sent." : "Not verified. Email failed.",
          needsVerification: true
        });
      }

      if (user.role === UserRole.OFFICER && !user.isApproved) {
        return res.status(403).json({ message: "Pending Admin approval." });
      }

      if (!JWT_SECRET) return res.status(500).json({ message: "Server authentication is not configured." });
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const userObj = user.toObject();
      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = userObj;
      res.status(200).json({ ...userWithoutSensitiveData, id: user._id, token });
    } catch (error) {
      res.status(500).json({ message: "Login failed." });
    }
  },

  approveOfficer: async (req: Request, res: Response) => {
    try {
      const { officerId } = req.body;
      await User.findByIdAndUpdate(officerId, { isApproved: true });
      res.json({ message: "Officer approved" });
    } catch (error) {
      res.status(500).json({ message: "Approval failed." });
    }
  },

  declineOfficer: async (req: Request, res: Response) => {
    try {
      const { officerId } = req.body;
      await User.findByIdAndDelete(officerId);
      res.json({ message: "Officer declined and removed" });
    } catch (error) {
      res.status(500).json({ message: "Decline failed." });
    }
  },

  getPendingOfficers: async (req: Request, res: Response) => {
    try {
      const officers = await User.find({ role: 'Officer', isApproved: false }).lean();
      res.json(officers.map(o => ({ ...o, id: o._id })));
    } catch (error) {
      res.status(500).json({ message: "Error." });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      if (!email) return res.status(400).json({ message: 'Email required' });
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'Email not found' });
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = resetCode;
      user.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      const emailRes = await emailService.sendForgotPasswordEmail(email, resetCode, user.role as any);
      if (!emailRes.success) return res.status(503).json({ message: "Email delivery failed." });
      res.json({ message: "Code sent." });
    } catch (error) {
      res.status(500).json({ message: "Recovery error." });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { code, newPassword } = req.body;
      const user = await User.findOne({ email });
      if (!user || user.verificationCode !== code) return res.status(400).json({ message: "Invalid code" });
      if (user.verificationExpiry && user.verificationExpiry < new Date()) {
          return res.status(400).json({ message: "OTP expired." });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      user.verificationCode = undefined;
      user.verificationExpiry = undefined;
      await user.save();
      res.json({ message: "Successful." });
    } catch (error) {
      res.status(500).json({ message: "Reset failed." });
    }
  }
};
