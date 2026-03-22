import { Request, Response } from "express";
import { userService } from "../services/userService.ts";
import { emailService } from "../services/emailService.ts";
import { UserRole } from "../../src/types.ts";
import { User } from "../models/User.ts";

export const userController = {
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, role, department } = req.body;
      
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (role === UserRole.ADMIN && password !== "@Nammatha") {
        return res.status(403).json({ message: "Invalid Admin authorization password" });
      }

      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const user = await userService.register({
        name,
        email,
        password,
        role: role as UserRole,
        department
      });

      if (user.verificationCode) {
        await emailService.sendVerificationEmail(email, user.verificationCode);
      }

      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = user;
      res.status(201).json({
        ...userWithoutSensitiveData,
        message: "Verification code sent to your email. Please verify to complete registration."
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Error during registration" });
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const isVerified = await userService.verifyUser(email, code);
      if (isVerified) {
        res.status(200).json({ message: "Email verified successfully. You can now log in." });
      } else {
        res.status(400).json({ message: "Invalid or expired verification code" });
      }
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: "Error during verification" });
    }
  },

  resendCode: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      await userService.updateVerificationCode(email, newCode);
      
      await emailService.sendVerificationEmail(email, newCode);

      res.status(200).json({ message: "New verification code sent to your email." });
    } catch (error) {
      console.error('Resend code error:', error);
      res.status(500).json({ message: "Error resending verification code" });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;
      const user = await userService.findByEmail(email);
      
      if (!user || user.password !== password || user.role !== role) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.isVerified === false) {
        return res.status(403).json({ 
          message: "Email not verified. Please verify your email before logging in.",
          needsVerification: true 
        });
      }

      if (user.role === UserRole.OFFICER && !user.isApproved) {
        return res.status(403).json({ 
          message: "Your account is pending Admin approval. You will gain access once an Admin approves your registration."
        });
      }

      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = user;
      res.status(200).json(userWithoutSensitiveData);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Error during login" });
    }
  },

  approveOfficer: async (req: Request, res: Response) => {
    try {
      const { officerId } = req.body;
      if (!officerId) return res.status(400).json({ message: "Officer ID required" });
      
      await User.findByIdAndUpdate(officerId, { isApproved: true });
      res.json({ message: "Officer approved successfully" });
    } catch (error) {
      console.error('Approval error:', error);
      res.status(500).json({ message: "Error approving officer" });
    }
  },

  getPendingOfficers: async (req: Request, res: Response) => {
    try {
      const officers = await User.find({ role: 'Officer', isApproved: false }).lean();
      res.json(officers);
    } catch (error) {
      console.error('Error fetching pending officers:', error);
      res.status(500).json({ message: "Error fetching pending officers" });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });
     
      const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
      if (!user) return res.status(404).json({ message: 'No account found with this email' });

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = resetCode;
      await user.save();

      let emailSent = false;
      let devCode: string | undefined;
      try {
        await emailService.sendForgotPasswordEmail(email, resetCode, user.role as any);
        emailSent = true;
      } catch (err) {
        console.error('[OTP] Forgot-password email failed:', err);
        devCode = resetCode;
      }
      res.json({
        message: emailSent ? 'Password reset OTP sent to your email.' : `Email failed. Use this code: ${resetCode}`,
        ...(devCode ? { devCode } : {})
      });
    } catch (error) {
      res.status(500).json({ message: 'Error sending reset email' });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ message: 'All fields required' });
      
      const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
      if (!user || user.verificationCode !== code) return res.status(400).json({ message: 'Invalid or expired OTP' });

      user.password = newPassword;
      user.verificationCode = undefined;
      await user.save();
      res.json({ message: 'Password reset successfully. Please login.' });
    } catch (error) {
      res.status(500).json({ message: 'Error resetting password' });
    }
  }
};
