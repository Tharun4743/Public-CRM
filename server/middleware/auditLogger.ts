import { Request, Response, NextFunction } from 'express';
import db from '../db/database.ts';
import { v4 as uuidv4 } from 'uuid';

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  // Only intercept state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Skip audit logging for certain routes if needed (e.g. login, analytics)
  if (req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/analytics')) {
    return next();
  }

  // Get user from headers (assuming frontend sends these until JWT is implemented)
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const userRole = req.headers['x-user-role'] as string || 'visitor';
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Extract complaint ID if present in the URL
  let complaintId: string | null = null;
  const match = req.path.match(/\/complaints\/([^\/]+)/);
  if (match) {
    complaintId = match[1];
  }

  // Fetch old record if updating/deleting
  let oldValue: any = null;
  if (complaintId && (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')) {
    try {
      oldValue = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
    } catch (err) {
      console.error('Audit Logger: Error fetching old value', err);
    }
  }

  // Intercept response to get new value and completion status
  const originalSend = res.send;
  res.send = function (body: any) {
    res.send = originalSend;
    const response = originalSend.call(this, body);

    // Only log successful operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let newValue: any = null;
      if (complaintId && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        try {
           newValue = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
        } catch (err) {}
      } else if (!complaintId && req.method === 'POST') {
         // Maybe the ID is in the response body?
         try {
           const parsedBody = JSON.parse(body);
           if (parsedBody.id) {
             newValue = db.prepare('SELECT * FROM complaints WHERE id = ?').get(parsedBody.id);
             complaintId = parsedBody.id;
           }
         } catch (err) {}
      }

      const auditId = uuidv4();
      const action = `${req.method} ${req.path}`;
      
      try {
        db.prepare(`
          INSERT INTO audit_log (id, user_id, user_role, action, complaint_id, old_value, new_value, ip_address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          auditId, 
          userId, 
          userRole, 
          action, 
          complaintId, 
          JSON.stringify(oldValue), 
          JSON.stringify(newValue), 
          ipAddress, 
          new Date().toISOString()
        );
      } catch (err) {
        console.error('Audit Logger: Error saving log', err);
      }
    }

    return response;
  } as any;

  next();
};
