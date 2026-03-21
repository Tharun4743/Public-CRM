import { Complaint, ComplaintStatus, ComplaintPriority } from "../../src/types.ts";
import db from '../db/database.ts';
import { notificationService } from './notificationService.ts';
import { rewardsService } from './rewardsService.ts';

export const complaintService = {
  getAll: async (): Promise<Complaint[]> => {
    return db.prepare('SELECT * FROM complaints ORDER BY createdAt DESC').all() as Complaint[];
  },

  getById: async (id: string): Promise<Complaint | undefined> => {
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
  },

  create: async (data: any): Promise<Complaint> => {
    const citizenId = data.citizen_id;
    const rule = db.prepare(`
      SELECT * FROM sla_rules
      WHERE is_active = 1
      AND (category = ? OR category IS NULL)
      AND (priority = ? OR priority IS NULL)
      AND (department_id = ? OR department_id IS NULL)
      ORDER BY
        CASE WHEN category IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE WHEN priority IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE WHEN department_id IS NOT NULL THEN 1 ELSE 0 END DESC
      LIMIT 1
    `).get(data.category || null, data.priority || 'Medium', null) as any;

    const slaHours = rule?.sla_hours || 72;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    const newComplaint: any = {
      ...data,
      id: `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: ComplaintStatus.PENDING,
      priority: data.priority || 'Medium',
      sla_deadline: slaDeadline,
      sla_status: 'On Track',
      escalation_level: 0,
      source: data.source || 'web',
      citizen_phone: data.citizen_phone || null,
      citizen_email: data.citizen_email || null,
      citizen_id: data.citizen_id || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      address: data.address || null,
      complaint_image: data.complaint_image || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stmt = db.prepare(`
        INSERT INTO complaints (
            id, citizenName, contactInfo, category, description, department, status, priority, 
            createdAt, updatedAt, assignedTo, ai_priority, sentiment_score, urgency_level, 
            estimated_resolution_days, ai_summary, ai_tags, recommended_department,
            sla_deadline, sla_status, escalation_level, vote_count, is_cluster_head,
            source, citizen_phone, citizen_id, latitude, longitude, address, complaint_image, citizen_email
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newComplaint.id,
      newComplaint.citizenName,
      newComplaint.contactInfo,
      newComplaint.category,
      newComplaint.description,
      newComplaint.department,
      newComplaint.status,
      newComplaint.priority,
      newComplaint.createdAt,
      newComplaint.updatedAt,
      newComplaint.assignedTo || null,
      newComplaint.ai_priority || null,
      newComplaint.sentiment_score || null,
      newComplaint.urgency_level || null,
      newComplaint.estimated_resolution_days || null,
      newComplaint.ai_summary || null,
      newComplaint.ai_tags ? JSON.stringify(newComplaint.ai_tags) : null,
      newComplaint.recommended_department || null,
      newComplaint.sla_deadline,
      newComplaint.sla_status,
      newComplaint.escalation_level,
      1, // vote_count
      0,  // is_cluster_head
      newComplaint.source,
      newComplaint.citizen_phone,
      newComplaint.citizen_id,
      newComplaint.latitude,
      newComplaint.longitude,
      newComplaint.address,
      newComplaint.complaint_image,
      newComplaint.citizen_email
    );

    // RAWARDS SYSTEM INTEGRATION
    if (citizenId) {
      const citizen = db.prepare('SELECT total_complaints FROM citizens WHERE id = ?').get(citizenId) as any;
      
      // Points for submit
      await rewardsService.awardPoints(citizenId, 10, 'Submit complaint', newComplaint.id);
      
      // Bonus: Photo
      if (newComplaint.complaint_image) {
          await rewardsService.awardPoints(citizenId, 5, 'Upload photo evidence', newComplaint.id);
      }
      
      // Bonus: Location
      if (newComplaint.latitude && newComplaint.longitude) {
          await rewardsService.awardPoints(citizenId, 5, 'Attach location data', newComplaint.id);
      }
      
      // Welcome bonus
      if (citizen && citizen.total_complaints === 1) { // total_complaints was incremented inside awardPoints in previous call
          await rewardsService.awardPoints(citizenId, 25, 'First Ever Complaint Bonus', newComplaint.id);
      }
    }

    return newComplaint;
  },

  resolve: async (id: string, proof: string, notes: string, officerId: string): Promise<Complaint | undefined> => {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE complaints 
      SET status = ?, resolution_proof = ?, resolution_notes = ?, resolved_at = ?, resolved_by_officer_id = ?, updatedAt = ? 
      WHERE id = ?
    `).run(ComplaintStatus.RESOLVED, proof, notes, now, officerId, now, id);

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
    if (complaint) {
      // Award points on resolution
      if (complaint.citizen_id) {
          await rewardsService.awardPoints(complaint.citizen_id, 20, 'Grievance Resolved', id);
      }

      await notificationService.create(null, id, 'status_change', `Grievance ${id} has been RESOLVED with photographic proof.`);
      
      // Generate one-time feedback token
      const token = Math.random().toString(36).substr(2, 12).toUpperCase();
      const feedbackId = `FB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      db.prepare('INSERT INTO feedback (id, complaint_id, token) VALUES (?, ?, ?)')
        .run(feedbackId, id, token);

      // Send email to citizen
      const targetEmail = complaint.citizen_email || complaint.contactInfo;
      console.log(`✅ Complaint ${id} marked as RESOLVED`);
      if (targetEmail && targetEmail.includes('@')) {
         console.log(`📧 Sending feedback token email to: ${targetEmail}`);
         console.log(`🔑 Feedback token: ${token}`);
         const { emailService } = await import('./emailService.ts');
         emailService.sendResolutionEmail(targetEmail, id, notes);
         emailService.sendFeedbackEmail(targetEmail, id, token);
      }
    }
    return complaint;
  },

  updateResolutionSteps: async (id: string, steps: any): Promise<void> => {
    db.prepare('UPDATE complaints SET ai_resolution_steps = ?, updatedAt = ? WHERE id = ?')
      .run(JSON.stringify(steps), new Date().toISOString(), id);
  },

  assign: async (id: string, department: string): Promise<Complaint | undefined> => {
    db.prepare('UPDATE complaints SET department = ?, updatedAt = ? WHERE id = ?').run(department, new Date().toISOString(), id);
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
    if (complaint) {
      await notificationService.create(null, id, 'assignment', `New complaint ${id} has been assigned to ${department} department.`);
    }
    return complaint;
  },

  updateStatus: async (id: string, status: ComplaintStatus): Promise<Complaint | undefined> => {
    if (status === ComplaintStatus.RESOLVED) {
      const blockers = db.prepare(`
        SELECT COUNT(*) as pendingCount
        FROM complaint_collaborators
        WHERE complaint_id = ? AND sub_status != 'Resolved'
      `).get(id) as any;
      if ((blockers?.pendingCount || 0) > 0) {
        throw new Error('All collaborating departments must complete before final resolution.');
      }
    }
    db.prepare('UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?').run(status, new Date().toISOString(), id);
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
    if (complaint) {
       await notificationService.create(null, id, 'status_change', `Status of complaint ${id} has been updated to ${status}.`);
    }
    return complaint;
  },

  getByDepartment: async (department: string): Promise<Complaint[]> => {
    return db.prepare('SELECT * FROM complaints WHERE department = ? ORDER BY createdAt DESC').all(department) as Complaint[];
  },

  hasBreached: async (): Promise<boolean> => {
    const res = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE sla_status = 'Breached'").get() as any;
    return res.count > 0;
  },

  getSlaStats: async () => {
    const stats = {
      onTrack: (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE sla_status = 'On Track'").get() as any).count,
      atRisk: (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE sla_status = 'At Risk'").get() as any).count,
      breached: (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE sla_status = 'Breached'").get() as any).count,
      escalated: (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE escalation_level > 0").get() as any).count,
    };
    return stats;
  },

  search: async (filters: any, page: number = 1, limit: number = 20) => {
    let query = "SELECT * FROM complaints WHERE 1=1";
    const params: any[] = [];

    if (filters.q) {
      query += " AND (id LIKE ? OR description LIKE ? OR citizenName LIKE ?)";
      const term = `%${filters.q}%`;
      params.push(term, term, term);
    }
    if (filters.category && filters.category !== 'All') { query += " AND category = ?"; params.push(filters.category); }
    if (filters.priority && filters.priority !== 'All') { query += " AND priority = ?"; params.push(filters.priority); }
    if (filters.status && filters.status !== 'All') { query += " AND status = ?"; params.push(filters.status); }
    if (filters.department && filters.department !== 'All') { query += " AND department = ?"; params.push(filters.department); }
    if (filters.slaStatus && filters.slaStatus !== 'All') { query += " AND sla_status = ?"; params.push(filters.slaStatus); }
    
    if (filters.dateFrom) { query += " AND createdAt >= ?"; params.push(filters.dateFrom); }
    if (filters.dateTo) { query += " AND createdAt <= ?"; params.push(filters.dateTo); }
    
    if (filters.minSentiment) { query += " AND sentiment_score >= ?"; params.push(filters.minSentiment); }
    if (filters.maxSentiment) { query += " AND sentiment_score <= ?"; params.push(filters.maxSentiment); }

    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const totalResult = db.prepare(countQuery).get(...params) as any;
    const total = totalResult ? totalResult.total : 0;

    query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    params.push(limit, (page - 1) * limit);

    const complaints = db.prepare(query).all(...params) as any[];

    return { complaints, total, page, totalPages: Math.ceil(total / limit) };
  },

  generateCsv: async (filters: any) => {
    let query = "SELECT id, category, priority, status, department, sla_status, sentiment_score, createdAt FROM complaints WHERE 1=1";
    const params: any[] = [];
    
    if (filters.q) {
        query += " AND (id LIKE ? OR description LIKE ? OR citizenName LIKE ?)";
        const term = `%${filters.q}%`;
        params.push(term, term, term);
    }
    if (filters.category && filters.category !== 'All') { query += " AND category = ?"; params.push(filters.category); }
    if (filters.priority && filters.priority !== 'All') { query += " AND priority = ?"; params.push(filters.priority); }
    if (filters.status && filters.status !== 'All') { query += " AND status = ?"; params.push(filters.status); }
    if (filters.department && filters.department !== 'All') { query += " AND department = ?"; params.push(filters.department); }
    if (filters.slaStatus && filters.slaStatus !== 'All') { query += " AND sla_status = ?"; params.push(filters.slaStatus); }
    if (filters.dateFrom) { query += " AND createdAt >= ?"; params.push(filters.dateFrom); }
    if (filters.dateTo) { query += " AND createdAt <= ?"; params.push(filters.dateTo); }

    const records = db.prepare(query).all(...params) as any[];
    
    if (records.length === 0) return "ID,Category,Priority,Status,Department,SLA Status,Sentiment,Created At\n";

    const header = "ID,Category,Priority,Status,Department,SLA Status,Sentiment,Created At";
    const rows = records.map(r => 
        [r.id, r.category, r.priority, r.status, r.department, r.sla_status, r.sentiment_score, r.createdAt]
        .map(v => `"${v ?? ''}"`).join(",")
    ).join("\n");

    return `${header}\n${rows}`;
  }
  ,
  getGeoData: async () => {
    return db.prepare(`
      SELECT id, category, priority, status, vote_count, latitude, longitude, description
      FROM complaints
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `).all();
  },
  bulkUpdate: async (ids: string[], action: any) => {
    const tx = db.transaction(() => {
      for (const id of ids) {
        if (action.type === 'assign_department') {
          db.prepare('UPDATE complaints SET department = ?, updatedAt = ? WHERE id = ?')
            .run(action.value, new Date().toISOString(), id);
        } else if (action.type === 'change_priority') {
          db.prepare('UPDATE complaints SET priority = ?, updatedAt = ? WHERE id = ?')
            .run(action.value, new Date().toISOString(), id);
        } else if (action.type === 'change_status') {
          db.prepare('UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?')
            .run(action.value, new Date().toISOString(), id);
        } else if (action.type === 'close') {
          db.prepare("UPDATE complaints SET status = 'Resolved', updatedAt = ? WHERE id = ?")
            .run(new Date().toISOString(), id);
        } else if (action.type === 'escalate') {
          db.prepare('UPDATE complaints SET escalation_level = escalation_level + 1, updatedAt = ? WHERE id = ?')
            .run(new Date().toISOString(), id);
        }
      }
    });
    tx();
    return { updated: ids.length };
  }
};

