import db from '../db/database.ts';

export const auditService = {
  getLogs: async (filters: { complaint_id?: string, user_id?: string, dateFrom?: string, dateTo?: string }, page: number = 1) => {
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params: any[] = [];

    if (filters.complaint_id && filters.complaint_id !== '') {
      query += ' AND complaint_id = ?';
      params.push(filters.complaint_id);
    }
    if (filters.user_id && filters.user_id !== '') {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }
    if (filters.dateFrom && filters.dateFrom !== '') {
      query += ' AND created_at >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo && filters.dateTo !== '') {
      query += ' AND created_at <= ?';
      params.push(filters.dateTo + 'T23:59:59');
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params) as { count: number };
    const logs = db.prepare(`${query} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as any[];

    return {
      logs,
      total: total.count,
      totalPages: Math.ceil(total.count / limit),
      currentPage: page
    };
  }
};
