import { AuditLog } from '../models/System.ts';

export const auditService = {
  getLogs: async (filters: { complaint_id?: string, user_id?: string, dateFrom?: string, dateTo?: string }, page: number = 1) => {
    const limit = 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.complaint_id) {
      query.complaint_id = filters.complaint_id;
    }
    if (filters.user_id) {
      query.user_id = filters.user_id;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo + 'T23:59:59');
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }
};
