import { Complaint, ComplaintStatus, ComplaintPriority } from "../../src/types.ts";
import db from '../db/database.ts';

export const complaintService = {
  getAll: async (): Promise<Complaint[]> => {
    return db.prepare('SELECT * FROM complaints ORDER BY createdAt DESC').all() as Complaint[];
  },

  getById: async (id: string): Promise<Complaint | undefined> => {
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
  },

  create: async (data: Omit<Complaint, "id" | "status" | "createdAt" | "updatedAt">): Promise<Complaint> => {
    const newComplaint: Complaint = {
      ...data,
      id: `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: ComplaintStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stmt = db.prepare(`
        INSERT INTO complaints (id, citizenName, contactInfo, category, description, department, status, priority, createdAt, updatedAt, assignedTo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      newComplaint.assignedTo || null
    );

    return newComplaint;
  },

  assign: async (id: string, department: string): Promise<Complaint | undefined> => {
    db.prepare('UPDATE complaints SET department = ?, updatedAt = ? WHERE id = ?').run(department, new Date().toISOString(), id);
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
  },

  updateStatus: async (id: string, status: ComplaintStatus): Promise<Complaint | undefined> => {
    db.prepare('UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?').run(status, new Date().toISOString(), id);
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
  },

  getByDepartment: async (department: string): Promise<Complaint[]> => {
    return db.prepare('SELECT * FROM complaints WHERE department = ? ORDER BY createdAt DESC').all(department) as Complaint[];
  }
};

