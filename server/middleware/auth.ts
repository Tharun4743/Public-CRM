import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ps-crm-secret-shared-2026';

export interface AuthenticatedRequest extends Request {
  citizen?: { id: string; email: string; role: string };
}

export const requireCitizenAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.citizen = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
