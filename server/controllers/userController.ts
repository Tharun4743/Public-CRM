import { Request, Response } from "express";
import { userService } from "../services/userService.ts";
import { emailService } from "../services/emailService.ts";
import { UserRole } from "../../src/types.ts";

export const userController = {
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, role, department, employeeId, idProof } = req.body;
      
      // Basic validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Enforce Admin password
      if (role === UserRole.ADMIN && password !== "@Nammatha") {
        return res.status(403).json({ message: "Invalid Admin authorization password" });
      }

      // Officer specific validation
      if (role === UserRole.OFFICER && (!employeeId || !idProof)) {
        return res.status(400).json({ message: "Employee ID and ID Proof are required for Officers" });
      }

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const user = await userService.register({
        name,
        email,
        password, // FUTURE: Hash the password before storing
        role: role as UserRole,
        department,
        employeeId,
        idProof
      });

      // Send verification email
      if (user.verificationCode) {
        await emailService.sendVerificationEmail(email, user.verificationCode);
      }

      // Don't return the password or verification code in the response
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

      // Generate a new code and update the user
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

      // Don't return the password or verification code in the response
      const { password: _, verificationCode: __, ...userWithoutSensitiveData } = user;
      res.status(200).json(userWithoutSensitiveData);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Error during login" });
    }
  }
};
