import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  citizen?: { id: string; email: string; role: string };
}

interface TokenClaims {
  id: string;
  email: string;
  role: string;
}

const readBearerToken = (req: Request): string => {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
};

const verifyToken = (token: string): TokenClaims | null => {
  if (!JWT_SECRET || !token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as TokenClaims;
  } catch {
    return null;
  }
};

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured' });
  const decoded = verifyToken(readBearerToken(req));
  if (decoded?.role === 'Admin') return next();
  res.status(403).json({ message: 'Administrative privileges required' });
};

export const requireOfficerAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured' });
  const decoded = verifyToken(readBearerToken(req));
  if (decoded?.role === 'Officer' || decoded?.role === 'Admin') return next();
  res.status(403).json({ message: 'Officer privileges required' });
};

export const requireAnyAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured' });
  const decoded = verifyToken(readBearerToken(req));
  if (!decoded) return res.status(401).json({ message: 'Authentication required' });
  req.citizen = decoded;
  next();
};

export const requireCitizenAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured' });
  const token = readBearerToken(req);
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: 'Invalid token' });
  req.citizen = decoded;
  next();
};
