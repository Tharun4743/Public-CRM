import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.ts';
import { requireCitizenAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { complaintService } from '../services/complaintService.ts';
import { emailService } from '../services/emailService.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pscrm-citizen-secret';

router.post('/register', async (req, res) => {
  const { name, email, phone, password, ward } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
  const exists = db.prepare('SELECT id FROM citizens WHERE LOWER(email)=LOWER(?)').get(email);
  if (exists) return res.status(409).json({ message: 'Citizen already exists' });
  const hash = await bcrypt.hash(password, 10);
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const result = db.prepare(`
    INSERT INTO citizens (name, email, phone, password_hash, ward, isVerified, verificationCode, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, email, phone || null, hash, ward || null, 0, verificationCode, new Date().toISOString());
  await emailService.sendVerificationEmail(email, verificationCode);

  res.status(201).json({ message: 'Verification code sent to email' });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const citizen = db.prepare('SELECT * FROM citizens WHERE LOWER(email)=LOWER(?)').get(email) as any;
    if (!citizen) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, citizen.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    if (!citizen.isVerified) return res.status(403).json({ message: 'Email not verified. Please verify your email before logging in.', needsVerification: true });
    const token = jwt.sign({ id: citizen.id, email: citizen.email, role: 'Citizen' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, citizen: { id: citizen.id, name: citizen.name, email: citizen.email, phone: citizen.phone, ward: citizen.ward } });
  } catch (error: any) {
    res.status(500).json({ message: 'Login encountered an error.' });
  }
});

router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required' });
  const citizen = db.prepare('SELECT * FROM citizens WHERE LOWER(email)=LOWER(?)').get(email) as any;
  if (citizen && citizen.verificationCode === code) {
    db.prepare('UPDATE citizens SET isVerified = 1, verificationCode = NULL WHERE id = ?').run(citizen.id);
    const token = jwt.sign({ id: citizen.id, email: citizen.email, role: 'Citizen' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: 'Verified successfully', citizen: { id: citizen.id, name: citizen.name, email: citizen.email, phone: citizen.phone, ward: citizen.ward } });
  } else {
    res.status(400).json({ message: 'Invalid or expired code' });
  }
});

router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const citizen = db.prepare('SELECT * FROM citizens WHERE LOWER(email)=LOWER(?)').get(email) as any;
  if (!citizen) return res.status(404).json({ message: 'Not found' });
  if (citizen.isVerified) return res.status(400).json({ message: 'Already verified' });
  
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.prepare('UPDATE citizens SET verificationCode = ? WHERE id = ?').run(newCode, citizen.id);
  await emailService.sendVerificationEmail(email, newCode);
  res.json({ message: 'New verification code sent to your email.' });
});

router.get('/me', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const citizen = db.prepare('SELECT id, name, email, phone, ward, created_at FROM citizens WHERE id = ?').get(req.citizen?.id);
  res.json(citizen || null);
});

router.get('/my-complaints', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const complaints = db.prepare('SELECT * FROM complaints WHERE contactInfo = ? OR citizen_id = ? ORDER BY createdAt DESC')
    .all(req.citizen?.email, req.citizen?.id);
  const stats = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) as resolved,
      AVG(CASE WHEN status='Resolved' THEN julianday(updatedAt)-julianday(createdAt) END) as avgDays,
      AVG(satisfaction_score) as avgSatisfaction
    FROM complaints
    WHERE contactInfo = ? OR citizen_id = ?
  `).get(req.citizen?.email, req.citizen?.id);
  res.json({ complaints, stats });
});

router.post('/my-complaints/:id/reopen', requireCitizenAuth, async (req: AuthenticatedRequest, res) => {
  const complaint: any = await complaintService.getById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Not found' });
  if (complaint.contactInfo !== req.citizen?.email && complaint.citizen_id !== req.citizen?.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare("UPDATE complaints SET status='In Progress', updatedAt=? WHERE id=?").run(new Date().toISOString(), req.params.id);
  res.json({ ok: true });
});

export default router;
