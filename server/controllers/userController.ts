import { Request, Response } from "express";
import { userService } from "../services/userService.ts";
import { emailService } from "../services/emailService.ts";
import { UserRole } from "../../src/types.ts";
import { User } from "../models/User.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'ps-crm-secret-shared-2026';

export const userController = {
  // -------------------------------------------------------------------------
  // 1. STAFF REGISTRATION (Normalization + Proper Password Hashing)
  // -------------------------------------------------------------------------
  register: async (req: Request, res: Response) => {
    let verificationCode = '';
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { name, password, role, department } = req.body;
      
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing Name, Email, Password, or Role" });
      }

      // 2. DUPLICATE CHECK
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      // Security check for Admin role
      if (role === UserRole.ADMIN && password !== "@Nammatha") {
        return res.status(403).json({ message: "Invalid Admin authorization password" });
      }

      const hashedPassword = await bcrypt.hash(password, 8);
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 Mins

      const user = await userService.register({
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        department,
        verificationCode,
        verificationExpiry
      });

      // Email Dispatch
      let emailSent = false;
      try {
        const emailRes = await emailService.sendVerificationEmail(email, verificationCode);
        emailSent = emailRes.success;
      } catch (err) {
        console.error('[AUTH] Staff Registration email failed:', err);
      }

      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = (user as any).toObject ? (user as any).toObject() : user;
      res.status(201).json({
        ...userWithoutSensitiveData,
        message: emailSent ? "Verification code sent to your email." : `Registration successful, but email failed. Code: ${verificationCode}`,
        ...(emailSent ? {} : { devCode: verificationCode })
      });
    } catch (error: any) {
      if (error.code === 11000) return res.status(409).json({ message: "Email already exists." });
      res.status(500).json({ message: "Internal server error during registration." });
    }
  },

  // -------------------------------------------------------------------------
  // 2. VERIFICATION & RESEND (5-Min Expiry Support)
  // -------------------------------------------------------------------------
  verifyEmail: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { code } = req.body;
      if (!email || !code) return res.status(400).json({ message: "Email and code required" });

      const user = await User.findOne({ email });
      if (!user || user.verificationCode !== code) return res.status(400).json({ message: "Invalid verification code" });

      if (user.verificationExpiry && user.verificationExpiry < new Date()) {
          return res.status(400).json({ message: "Verification code has expired." });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationExpiry = undefined;
      await user.save();

      res.status(200).json({ message: "Email verified. You can now log in." });
    } catch (error) {
      res.status(500).json({ message: "Verification failed." });
    }
  },

  resendCode: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.isVerified) return res.status(400).json({ message: "Already verified" });

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = newCode;
      user.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      
      const emailRes = await emailService.sendVerificationEmail(email, newCode);
      res.status(200).json({ 
          message: emailRes.success ? "New code sent to your email." : `Email failed. Use code: ${newCode}`,
          ...(emailRes.success ? {} : { devCode: newCode })
      });
    } catch (error) {
      res.status(500).json({ message: "Resend failed." });
    }
  },

  // -------------------------------------------------------------------------
  // 3. LOGIN (Normalization + Legacy Support removed for strict production)
  // -------------------------------------------------------------------------
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
          message: emailRes.success ? "Email not verified. A new code was sent." : `Not verified. Email failed. Code: ${newCode}`,
          needsVerification: true,
          ...(emailRes.success ? {} : { devCode: newCode })
        });
      }

      if (user.role === UserRole.OFFICER && !user.isApproved) {
        return res.status(403).json({ message: "Pending Admin approval." });
      }

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = (user as any).toObject ? (user as any).toObject() : user;

      res.status(200).json({ ...userWithoutSensitiveData, token });
    } catch (error) {
      res.status(500).json({ message: "Login failed." });
    }
  },

  // -------------------------------------------------------------------------
  // 4. ADMIN ACTIONS (Approve Officer)
  // -------------------------------------------------------------------------
  approveOfficer: async (req: Request, res: Response) => {
    try {
      const { officerId } = req.body;
      if (!officerId) return res.status(400).json({ message: "Officer ID required" });
      
      await User.findByIdAndUpdate(officerId, { isApproved: true });
      res.json({ message: "Officer approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Approval failed." });
    }
  },

  getPendingOfficers: async (req: Request, res: Response) => {
    try {
      const officers = await User.find({ role: 'Officer', isApproved: false }).lean();
      res.json(officers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending officers." });
    }
  },

  // -------------------------------------------------------------------------
  // 5. STAFF RECOVERY
  // -------------------------------------------------------------------------
  forgotPassword: async (req: Request, res: Response) => {
    let resetCode = '';
    try {
      const email = req.body.email?.toLowerCase().trim();
      if (!email) return res.status(400).json({ message: 'Email required' });
     
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'Email not found' });

      resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = resetCode;
      user.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      const emailRes = await emailService.sendForgotPasswordEmail(email, resetCode, user.role as any);
      res.json({
        message: emailRes.success ? 'Recovery code sent.' : `Email failed. Code: ${resetCode}`,
        ...(emailRes.success ? {} : { devCode: resetCode })
      });
    } catch (error) {
      res.status(500).json({ message: 'Recovery error.', devCode: resetCode || undefined });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const { code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ message: 'Missing fields' });
      
      const user = await User.findOne({ email });
      if (!user || user.verificationCode !== code) return res.status(400).json({ message: 'Invalid code' });

      if (user.verificationExpiry && user.verificationExpiry < new Date()) {
          return res.status(400).json({ message: "OTP expired." });
      }

      user.password = await bcrypt.hash(newPassword, 8);
      user.verificationCode = undefined;
      user.verificationExpiry = undefined;
      await user.save();
      res.json({ message: 'Password reset successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Reset failed.' });
    }
  }
};
