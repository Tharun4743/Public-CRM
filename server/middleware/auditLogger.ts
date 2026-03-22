import { Request, Response, NextFunction } from 'express';
import { Complaint } from '../models/Complaint.ts';
import { AuditLog } from '../models/System.ts';

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
  const ipAddress = (req.ip || (req.socket as any).remoteAddress) as string;

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
      oldValue = await Complaint.findById(complaintId).lean();
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
      (async () => {
        let newValue: any = null;
        if (complaintId && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          try {
             newValue = await Complaint.findById(complaintId).lean();
          } catch (err) {}
        } else if (!complaintId && req.method === 'POST') {
           // Maybe the ID is in the response body?
           try {
             const parsedBody = JSON.parse(body);
             const bodyId = parsedBody._id || parsedBody.id;
             if (bodyId) {
               newValue = await Complaint.findById(bodyId).lean();
               complaintId = bodyId;
             }
           } catch (err) {}
        }

        const action = `${req.method} ${req.path}`;
        
        try {
          await AuditLog.create({
            user_id: userId,
            user_role: userRole,
            action,
            complaint_id: (complaintId && complaintId.length === 24) ? complaintId : undefined, // only if valid ObjectId string or mixed
            old_value: JSON.stringify(oldValue),
            new_value: JSON.stringify(newValue),
            ip_address: ipAddress
          });
        } catch (err) {
          console.error('Audit Logger: Error saving log', err);
        }
      })();
    }

    return response;
  } as any;

  next();
};
