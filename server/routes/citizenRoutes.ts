import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Citizen } from '../models/Citizen.ts';
import { Complaint } from '../models/Complaint.ts';
import { requireCitizenAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { complaintService } from '../services/complaintService.ts';
import { emailService } from '../services/emailService.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pscrm-citizen-secret';

router.post('/register', async (req, res) => {
  const { name, email, phone, password, ward, address } = req.body;
  
  // 1. INPUT VALIDATION & LOGGING
  console.log(`[AUTH] Citizen Registration Attempt: <${email || 'N/A'}>`);
  if (!name || !email || !password) {
    console.warn('[AUTH] Registration rejected: Missing required fields');
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // 2. DUPLICATE CHECK
    let existingCitizen;
    try {
      const safeEmail = email.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      existingCitizen = await Citizen.findOne({ 
        email: { $regex: new RegExp(`^${safeEmail}$`, 'i') } 
      });
    } catch (findErr: any) {
      console.error('[AUTH] FindOne failure:', findErr);
      return res.status(500).json({ message: 'Database lookup failed during registration', error: findErr.message });
    }

    if (existingCitizen) {
      console.warn(`[AUTH] Registration rejected: Duplicate email found <${email}>`);
      return res.status(409).json({ message: 'An account with this email already exists. Please login.' });
    }

    // 3. CRYPTO & PREPARATION
    let hash;
    try {
      console.log('[AUTH] Hashing password...');
      hash = await bcrypt.hash(password, 8);
    } catch (hashErr: any) {
      console.error('[AUTH] Bcrypt failure:', hashErr);
      return res.status(500).json({ message: 'Security encryption failed', error: hashErr.message });
    }
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. DATABASE CREATION
    console.log('[AUTH] Creating database entry...');
    let citizen;
    try {
      citizen = await Citizen.create({
        name,
        email: email.toLowerCase().trim(),
        phone,
        password_hash: hash,
        ward,
        address,
        isVerified: false,
        verificationCode,
      });
    } catch (dbErr: any) {
      if (dbErr.code === 11000) return res.status(409).json({ message: 'Email address is already registered.' });
      console.error('[AUTH] Citizen.create failure:', dbErr);
      return res.status(500).json({ message: 'Failed to create citizen record', error: dbErr.message });
    }

    // 5. EMAIL DELIVERY
    let emailSent = false;
    try {
      await emailService.sendVerificationEmail(email, verificationCode);
      emailSent = true;
    } catch (emailErr: any) {
      console.error('[AUTH] Email delivery failed:', emailErr.message);
    }

    const isRealSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'mock_user@ethereal.email');
    
    return res.status(201).json({ 
      message: emailSent ? 'Verification code sent to your email.' : `Registration successful, but email delivery failed. Code: ${verificationCode}`,
      ...(isRealSmtp && emailSent ? {} : { devCode: verificationCode }),
      citizen: { id: citizen._id, name: citizen.name, email: citizen.email }
    });

  } catch (err: any) {
    console.error('[AUTH] UNEXPECTED FATAL ERROR:', err);
    return res.status(500).json({ 
      message: 'A critical server error occurred.', 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN] Attempt for email: ${email}`);
    
    const citizen = await Citizen.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!citizen) {
      console.log(`[LOGIN] User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    if (!citizen.isVerified) {
      console.log(`[LOGIN] User not verified: ${email}`);
      return res.status(401).json({ message: 'Please verify your email first. Check your inbox for the verification code.' });
    }
    
    const isValid = await bcrypt.compare(password, citizen.password_hash);
    if (!isValid) {
      console.log(`[LOGIN] Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    const token = jwt.sign({ id: citizen._id, email: citizen.email, role: 'Citizen' }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`[LOGIN] Success for: ${email}`);
    res.json({ token, citizen: { id: citizen._id, name: citizen.name, email: citizen.email, phone: citizen.phone, ward: citizen.ward } });
  } catch (error: any) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({ message: 'Login encountered an error.' });
  }
});

router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required' });
  
  const citizen = await Citizen.findOne({ email: new RegExp(`^${email}$`, 'i') });
  if (citizen && citizen.verificationCode === code) {
    citizen.isVerified = true;
    citizen.verificationCode = undefined;
    await citizen.save();
    
    const token = jwt.sign({ id: citizen._id, email: citizen.email, role: 'Citizen' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: 'Verified successfully', citizen: { id: citizen._id, name: citizen.name, email: citizen.email, phone: citizen.phone, ward: citizen.ward } });
  } else {
    res.status(400).json({ message: 'Invalid or expired code' });
  }
});

router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  
  const citizen = await Citizen.findOne({ email: new RegExp(`^${email}$`, 'i') });
  if (!citizen) return res.status(404).json({ message: 'Not found' });
  if (citizen.isVerified) return res.status(400).json({ message: 'Already verified' });
  
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  citizen.verificationCode = newCode;
  await citizen.save();
  
  console.log(`[OTP] Resent OTP for ${email}: ${newCode}`);
  let emailSent = false;
  try {
    await emailService.sendVerificationEmail(email, newCode);
    emailSent = true;
  } catch (err) {
    console.error('[OTP] Resend email failed:', err);
  }
  const isRealSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'mock_user@ethereal.email');
  res.json({ 
    message: emailSent ? 'New verification code sent to your email.' : `Email failed. Use this code: ${newCode}`,
    ...(isRealSmtp && emailSent ? {} : { devCode: newCode })
  });
});

router.get('/me', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const citizen = await Citizen.findById(req.citizen?.id).select('name email phone ward address total_points total_complaints badges createdAt').lean();
  res.json(citizen || null);
});

router.put('/update-profile', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const { name, phone, ward, address } = req.body;
  try {
    const citizen = await Citizen.findById(req.citizen?.id);
    if (!citizen) return res.status(404).json({ message: 'Citizen not found' });

    if (name) citizen.name = name;
    if (phone) citizen.phone = phone;
    if (ward) citizen.ward = ward;
    if (address) citizen.address = address;

    await citizen.save();
    res.json({ 
      message: 'Profile updated successfully', 
      citizen: { 
        id: citizen._id, 
        name: citizen.name, 
        email: citizen.email, 
        phone: citizen.phone, 
        ward: citizen.ward, 
        address: citizen.address 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.get('/my-complaints', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const complaints = await Complaint.find({
    $or: [
      { citizen_email: req.citizen?.email },
      { contactInfo: req.citizen?.email },
      { citizen_id: req.citizen?.id }
    ]
  }).sort({ createdAt: -1 }).lean();

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  
  let totalSatisfaction = 0;
  let satisfactionCount = 0;
  let totalResolutionTime = 0;
  let resolutionCount = 0;

  complaints.forEach(c => {
    if (c.satisfaction_score) {
      totalSatisfaction += c.satisfaction_score;
      satisfactionCount++;
    }
    if (c.status === 'Resolved' && c.resolved_at) {
      const time = new Date(c.resolved_at).getTime() - new Date(c.createdAt).getTime();
      totalResolutionTime += time;
      resolutionCount++;
    }
  });

  const stats = {
    total,
    resolved,
    avgDays: resolutionCount > 0 ? (totalResolutionTime / resolutionCount) / (1000 * 60 * 60 * 24) : 0,
    avgSatisfaction: satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0
  };

  res.json({ complaints, stats });
});

router.post('/my-complaints/:id/reopen', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Not found' });
  
  const isOwner = complaint.citizen_email === req.citizen?.email || 
                  complaint.contactInfo === req.citizen?.email || 
                  complaint.citizen_id?.toString() === req.citizen?.id;

  if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
  
  complaint.status = 'In Progress' as any;
  complaint.updatedAt = new Date();
  await complaint.save();
  res.json({ ok: true });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  
  const citizen = await Citizen.findOne({ email: new RegExp(`^${email}$`, 'i') });
  if (!citizen) return res.status(404).json({ message: 'No account found with this email' });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  citizen.verificationCode = resetCode;
  await citizen.save();

  console.log(`[OTP] Forgot-password OTP for citizen ${email}: ${resetCode}`);

  let emailSent = false;
  let devCode: string | undefined;
  try {
    await emailService.sendForgotPasswordEmail(email, resetCode, 'Citizen');
    emailSent = true;
  } catch (err) {
    console.error('[OTP] Forgot-password email failed:', err);
    devCode = resetCode;
  }
  res.json({
    message: emailSent ? 'Password reset OTP sent to your email.' : `Email failed. Use this code: ${resetCode}`,
    ...(devCode ? { devCode } : {})
  });
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ message: 'All fields required' });
  
  const citizen = await Citizen.findOne({ email: new RegExp(`^${email}$`, 'i') });
  if (!citizen || citizen.verificationCode !== code) return res.status(400).json({ message: 'Invalid or expired OTP' });
  
  const hash = await bcrypt.hash(newPassword, 8);
  citizen.password_hash = hash;
  citizen.verificationCode = undefined;
  await citizen.save();
  res.json({ message: 'Password reset successfully. Please login.' });
});

export default router;
