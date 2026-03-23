import { Request, Response } from "express";
import { auditService } from "../services/auditService.ts";

export const auditController = {
  getLogs: async (req: Request, res: Response) => {
    try {
      const { complaint_id, user_id, dateFrom, dateTo, page } = req.query;
      const filters = { 
        complaint_id: (complaint_id as string) || undefined, 
        user_id: (user_id as string) || undefined, 
        dateFrom: (dateFrom as string) || undefined, 
        dateTo: (dateTo as string) || undefined 
      };
      
      const result = await auditService.getLogs(filters, Number(page) || 1);
      result.logs = result.logs.map((L: any) => ({ ...L, id: L._id }));
      res.json(result);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  }
};
