import { ComplaintStatus } from "../../src/types.ts";
import { Complaint, Feedback, ComplaintCollaborator } from '../models/Complaint.ts';
import { SLARule } from '../models/Reporting.ts';
import { Citizen } from '../models/Citizen.ts';
import { notificationService } from './notificationService.ts';
import { rewardsService } from './rewardsService.ts';

export const complaintService = {
  getAll: async (): Promise<any[]> => {
    return await Complaint.find().sort({ createdAt: -1 }).lean();
  },

  getById: async (id: string): Promise<any> => {
    // Check if id is ObjectId or CMP format
    const query = id.startsWith('CMP-') ? { _id: id } : (id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { id: id });
    return await Complaint.findOne(query).lean();
  },

  create: async (data: any): Promise<any> => {
    const citizenId = data.citizen_id;
    
    // Find matching SLA rule
    const rule = await SLARule.findOne({
      is_active: true,
      $and: [
        { $or: [{ category: data.category }, { category: null }] },
        { $or: [{ priority: data.priority || 'Medium' }, { priority: null }] }
      ]
    }).sort({
      category: -1,
      priority: -1
    }).lean();

    const slaHours = rule?.sla_hours || 72;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const complaintId = `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newComplaint = await Complaint.create({
      ...data,
      _id: complaintId, // Use CMP- as the MongoDB ID if possible/preferred, otherwise as a field
      status: ComplaintStatus.PENDING,
      priority: data.priority || 'Medium',
      sla_deadline: slaDeadline,
      sla_status: 'On Track',
      escalation_level: 0,
      source: data.source || 'web'
    });

    // RAWARDS SYSTEM INTEGRATION
    if (citizenId) {
      const citizen = await Citizen.findById(citizenId);
      
      // Points for submit
      await rewardsService.awardPoints(citizenId, 10, 'Submit complaint', complaintId);
      
      // Bonus: Photo
      if (newComplaint.complaint_image) {
          await rewardsService.awardPoints(citizenId, 5, 'Upload photo evidence', complaintId);
      }
      
      // Bonus: Location
      if (newComplaint.latitude && newComplaint.longitude) {
          await rewardsService.awardPoints(citizenId, 5, 'Attach location data', complaintId);
      }
      
      // Welcome bonus
      if (citizen && citizen.total_complaints === 1) { 
          await rewardsService.awardPoints(citizenId, 25, 'First Ever Complaint Bonus', complaintId);
      }
    }

    const plainComplaint = newComplaint.toObject();
    
    // Send Tracking Email immediately for Hackathon "WOW" factor
    const targetEmail = plainComplaint.citizen_email || plainComplaint.contactInfo;
    if (targetEmail && (targetEmail.includes('@'))) {
        try {
            const { emailService } = await import('./emailService.ts');
            emailService.sendTrackingCodeEmail(targetEmail, complaintId, plainComplaint.category);
        } catch (e) {
            console.error('[COMPLAINT] Delayed email sending failed - proceeding anyway');
        }
    }

    return plainComplaint;
  },

  resolve: async (id: string, proof: string, notes: string, officerId: string): Promise<any> => {
    const now = new Date();
    const complaint = await Complaint.findByIdAndUpdate(id, {
      status: ComplaintStatus.RESOLVED,
      resolution_proof: proof,
      resolution_notes: notes,
      resolved_at: now,
      resolved_by_officer_id: officerId,
      updatedAt: now
    }, { new: true });

    if (complaint) {
      if (complaint.citizen_id) {
          await rewardsService.awardPoints(complaint.citizen_id.toString(), 20, 'Grievance Resolved', id);
      }

      await notificationService.create(null, id, 'status_change', `Grievance ${id} has been RESOLVED with photographic proof.`);
      
      const token = Math.random().toString(36).substr(2, 12).toUpperCase();
      await Feedback.create({
        complaint_id: id,
        token
      });

      const targetEmail = complaint.citizen_email || complaint.contactInfo;
      if (targetEmail && targetEmail.includes('@')) {
         const { emailService } = await import('./emailService.ts');
         emailService.sendResolutionEmail(targetEmail, id, notes);
         emailService.sendFeedbackEmail(targetEmail, id, token);
      }
    }
    return complaint ? complaint.toObject() : undefined;
  },

  updateResolutionSteps: async (id: string, steps: any): Promise<void> => {
    await Complaint.findByIdAndUpdate(id, { ai_resolution_steps: JSON.stringify(steps), updatedAt: new Date() });
  },

  assign: async (id: string, department: string): Promise<any> => {
    const complaint = await Complaint.findByIdAndUpdate(id, { department, updatedAt: new Date() }, { new: true });
    if (complaint) {
      await notificationService.create(null, id, 'assignment', `New complaint ${id} has been assigned to ${department} department.`);
    }
    return complaint ? complaint.toObject() : undefined;
  },

  updateStatus: async (id: string, status: ComplaintStatus): Promise<any> => {
    if (status === ComplaintStatus.RESOLVED) {
      const pendingCollaborators = await ComplaintCollaborator.countDocuments({
        complaint_id: id,
        sub_status: { $ne: 'Resolved' }
      });
      if (pendingCollaborators > 0) {
        throw new Error('All collaborating departments must complete before final resolution.');
      }
    }
    const complaint = await Complaint.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
    if (complaint) {
       await notificationService.create(null, id, 'status_change', `Status of complaint ${id} has been updated to ${status}.`);
    }
    return complaint ? complaint.toObject() : undefined;
  },

  getByDepartment: async (department: string): Promise<any[]> => {
    return await Complaint.find({ department }).sort({ createdAt: -1 }).lean();
  },

  hasBreached: async (): Promise<boolean> => {
    const count = await Complaint.countDocuments({ sla_status: 'Breached' });
    return count > 0;
  },

  getSlaStats: async () => {
    return {
      onTrack: await Complaint.countDocuments({ sla_status: 'On Track' }),
      atRisk: await Complaint.countDocuments({ sla_status: 'At Risk' }),
      breached: await Complaint.countDocuments({ sla_status: 'Breached' }),
      escalated: await Complaint.countDocuments({ escalation_level: { $gt: 0 } }),
    };
  },

  search: async (filters: any, page: number = 1, limit: number = 20) => {
    const query: any = {};

    if (filters.q) {
      query.$or = [
        { _id: new RegExp(filters.q, 'i') },
        { description: new RegExp(filters.q, 'i') },
        { citizenName: new RegExp(filters.q, 'i') }
      ];
    }
    if (filters.category && filters.category !== 'All') { query.category = filters.category; }
    if (filters.priority && filters.priority !== 'All') { query.priority = filters.priority; }
    if (filters.status && filters.status !== 'All') { query.status = filters.status; }
    if (filters.department && filters.department !== 'All') { query.department = filters.department; }
    if (filters.slaStatus && filters.slaStatus !== 'All') { query.sla_status = filters.slaStatus; }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    if (filters.minSentiment || filters.maxSentiment) {
      query.sentiment_score = {};
      if (filters.minSentiment) query.sentiment_score.$gte = Number(filters.minSentiment);
      if (filters.maxSentiment) query.sentiment_score.$lte = Number(filters.maxSentiment);
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { complaints, total, page, totalPages: Math.ceil(total / limit) };
  },

  generateCsv: async (filters: any) => {
    const { complaints } = await complaintService.search(filters, 1, 10000);
    
    if (complaints.length === 0) return "ID,Category,Priority,Status,Department,SLA Status,Sentiment,Created At\n";

    const header = "ID,Category,Priority,Status,Department,SLA Status,Sentiment,Created At";
    const rows = complaints.map((r: any) => 
        [r._id, r.category, r.priority, r.status, r.department, r.sla_status, r.sentiment_score, r.createdAt]
        .map(v => `"${v ?? ''}"`).join(",")
    ).join("\n");

    return `${header}\n${rows}`;
  },

  getGeoData: async () => {
    return await Complaint.find({
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).select('_id category priority status vote_count latitude longitude description').lean();
  },

  bulkUpdate: async (ids: string[], action: any) => {
    const update: any = { updatedAt: new Date() };
    if (action.type === 'assign_department') update.department = action.value;
    else if (action.type === 'change_priority') update.priority = action.value;
    else if (action.type === 'change_status') update.status = action.value;
    else if (action.type === 'close') update.status = 'Resolved';
    else if (action.type === 'escalate') {
      await Complaint.updateMany({ _id: { $in: ids } }, { $inc: { escalation_level: 1 }, updatedAt: new Date() });
      return { updated: ids.length };
    }

    const result = await Complaint.updateMany({ _id: { $in: ids } }, update);
    return { updated: result.modifiedCount };
  }
};
