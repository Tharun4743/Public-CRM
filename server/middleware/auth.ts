import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ps-crm-secret-shared-2026';

export interface AuthenticatedRequest extends Request {
  citizen?: { id: string; email: string; role: string };
}

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers['x-user-role'];
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.role === 'Admin') return next();
    } catch {}
  }

  if (role === 'Admin') return next();
  
  res.status(403).json({ message: 'Administrative privileges required' });
};

export const requireOfficerAuth = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers['x-user-role'];
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.role === 'Officer' || decoded.role === 'Admin') return next();
    } catch {}
  }

  if (role === 'Officer' || role === 'Admin') return next();
  
  res.status(403).json({ message: 'Officer privileges required' });
};

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
