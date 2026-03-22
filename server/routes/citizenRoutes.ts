import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Citizen } from '../models/Citizen.ts';
import { Complaint } from '../models/Complaint.ts';
import { requireCitizenAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { complaintService } from '../services/complaintService.ts';
import { emailService } from '../services/emailService.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ps-crm-secret-shared-2026';

router.post('/register', async (req, res) => {
    try {
        const { name, phone, password, ward, address } = req.body;
        const email = req.body.email?.toLowerCase().trim();
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const existing = await Citizen.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiry = new Date(Date.now() + 5 * 60 * 1000); 

        const citizen = await Citizen.create({
            name,
            email,
            phone,
            password_hash: hash,
            ward,
            address,
            isVerified: false,
            verificationCode,
            verificationExpiry
        });

        const emailRes = await emailService.sendVerificationEmail(email, verificationCode);
        if (!emailRes.success) {
            return res.status(503).json({ message: "Account created, but verification email failed to send. Please log in to resend." });
        }

        return res.status(201).json({ 
            message: 'Verification code sent to your email.',
            citizen: { id: citizen._id, name: citizen.name, email: citizen.email }
        });

    } catch (err: any) {
        if (err.code === 11000) return res.status(409).json({ message: 'Email already exists.' });
        return res.status(500).json({ message: 'Registration server error.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const { password } = req.body;
        
        const citizen = await Citizen.findOne({ email });
        if (!citizen) return res.status(401).json({ message: 'Invalid email or password.' });
        
        const isValid = await bcrypt.compare(password, citizen.password_hash);
        if (!isValid) return res.status(401).json({ message: 'Invalid email or password.' });

        if (!citizen.isVerified) {
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            citizen.verificationCode = newCode;
            citizen.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
            await citizen.save();
            
            const emailRes = await emailService.sendVerificationEmail(email, newCode);
            return res.status(403).json({ 
                message: emailRes.success ? 'Account not verified. A new code was sent.' : 'Account not verified. Email failed.',
                needsVerification: true
            });
        }
        
        const token = jwt.sign({ id: citizen._id, email: citizen.email, role: 'Citizen' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, citizen: { id: citizen._id, name: citizen.name, email: citizen.email } });
    } catch (error) {
        res.status(500).json({ message: 'Login encountered an error.' });
    }
});

router.post('/verify-email', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const { code } = req.body;
        
        const citizen = await Citizen.findOne({ email });
        if (citizen && citizen.verificationCode === code) {
            if (citizen.verificationExpiry && citizen.verificationExpiry < new Date()) {
                return res.status(400).json({ message: 'OTP expired.' });
            }
            citizen.isVerified = true;
            citizen.verificationCode = undefined;
            citizen.verificationExpiry = undefined;
            await citizen.save();
            
            const token = jwt.sign({ id: citizen._id, email: citizen.email, role: 'Citizen' }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, message: 'Verified.', citizen: { id: citizen._id, name: citizen.name, email: citizen.email } });
        } else {
            res.status(400).json({ message: 'Invalid code.' });
        }
    } catch (e) {
        res.status(500).json({ message: 'Verification error.' });
    }
});

router.post('/resend-code', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const citizen = await Citizen.findOne({ email });
        if (!citizen) return res.status(404).json({ message: 'Account not found' });
        
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        citizen.verificationCode = newCode;
        citizen.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await citizen.save();
        
        const emailRes = await emailService.sendVerificationEmail(email, newCode);
        if (!emailRes.success) return res.status(503).json({ message: "Email failed." });
        res.json({ message: 'New code sent.' });
    } catch (e) {
        res.status(500).json({ message: 'Resend failed.' });
    }
});

router.get('/me', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
    const citizen = await Citizen.findById(req.citizen?.id).select('name email phone ward address total_points total_complaints badges createdAt').lean();
    res.json(citizen || null);
});

router.put('/update-profile', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { name, phone, ward, address } = req.body;
        const citizen = await Citizen.findById(req.citizen?.id);
        if (!citizen) return res.status(404).json({ message: 'Citizen not found' });
        if (name) citizen.name = name;
        if (phone) citizen.phone = phone;
        if (ward) citizen.ward = ward;
        if (address) citizen.address = address;
        await citizen.save();
        res.json({ message: 'Profile updated successfully', citizen: { id: citizen._id, name: citizen.name, email: citizen.email } });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
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
    res.json({ complaints });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        if (!email) return res.status(400).json({ message: 'Email required' });
        const citizen = await Citizen.findOne({ email });
        if (!citizen) return res.status(404).json({ message: 'Email not found' });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        citizen.verificationCode = resetCode;
        citizen.verificationExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await citizen.save();

        const emailRes = await emailService.sendForgotPasswordEmail(email, resetCode, 'Citizen');
        if (!emailRes.success) return res.status(503).json({ message: "Recovery email failed." });
        res.json({ message: 'Code sent.' });
    } catch (err) {
        res.status(500).json({ message: 'Recovery error.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const { code, newPassword } = req.body;
        const citizen = await Citizen.findOne({ email });
        if (!citizen || citizen.verificationCode !== code) return res.status(400).json({ message: 'Invalid code' });
        if (citizen.verificationExpiry && citizen.verificationExpiry < new Date()) {
            return res.status(400).json({ message: 'OTP expired.' });
        }
        citizen.password_hash = await bcrypt.hash(newPassword, 10);
        citizen.verificationCode = undefined;
        citizen.verificationExpiry = undefined;
        await citizen.save();
        res.json({ message: 'Successful.' });
    } catch (err) {
        res.status(500).json({ message: 'Reset failed' });
    }
});

export default router;
