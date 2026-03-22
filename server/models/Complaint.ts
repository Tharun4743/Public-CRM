import mongoose, { Schema } from 'mongoose';

export interface IComplaint {
    _id: string; // CMS-xxxx Custom ID format
    citizenName: string;
    contactInfo: string;
    category: string;
    description: string;
    department?: string;
    status: string;
    priority: string;
    assignedTo?: mongoose.Types.ObjectId;
    ai_priority?: string;
    sentiment_score?: number;
    urgency_level?: string;
    estimated_resolution_days?: number;
    ai_summary?: string;
    ai_tags?: string;
    ai_resolution_steps?: string;
    recommended_department?: string;
    sla_deadline?: Date;
    sla_status?: string;
    escalation_level: number;
    vote_count: number;
    is_cluster_head: boolean;
    resolution_proof?: string;
    resolution_notes?: string;
    resolved_at?: Date;
    resolved_by_officer_id?: mongoose.Types.ObjectId | string;
    satisfaction_score?: number;
    feedback_submitted: boolean;
    source: string;
    citizen_phone?: string;
    citizen_id?: mongoose.Types.ObjectId | string;
    latitude?: number;
    longitude?: number;
    address?: string;
    complaint_image?: string;
    citizen_email?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
    _id: { type: String, required: true },
    citizenName: { type: String, required: true },
    contactInfo: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String },
    status: { type: String, default: 'Pending' },
    priority: { type: String, default: 'Medium' },
    assignedTo: { type: Schema.Types.Mixed, ref: 'User' },
    ai_priority: { type: String },
    sentiment_score: { type: Number },
    urgency_level: { type: String },
    estimated_resolution_days: { type: Number },
    ai_summary: { type: String },
    ai_tags: { type: String },
    ai_resolution_steps: { type: String },
    recommended_department: { type: String },
    sla_deadline: { type: Date },
    sla_status: { type: String },
    escalation_level: { type: Number, default: 0 },
    vote_count: { type: Number, default: 1 },
    is_cluster_head: { type: Boolean, default: false },
    resolution_proof: { type: String },
    resolution_notes: { type: String },
    resolved_at: { type: Date },
    resolved_by_officer_id: { type: Schema.Types.Mixed, ref: 'User' },
    satisfaction_score: { type: Number },
    feedback_submitted: { type: Boolean, default: false },
    source: { type: String, default: 'web' },
    citizen_phone: { type: String },
    citizen_id: { type: Schema.Types.Mixed, ref: 'Citizen' },
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    complaint_image: { type: String },
    citizen_email: { type: String }
}, { timestamps: true, _id: false }); // Disable automatic _id generation so we can use ours

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);

export interface IComplaintVote {
    complaint_id: string;
    citizen_email: string;
    voted_at?: Date;
}

const ComplaintVoteSchema = new Schema<IComplaintVote>({
    complaint_id: { type: String, ref: 'Complaint', required: true },
    citizen_email: { type: String, required: true },
}, { timestamps: { createdAt: 'voted_at', updatedAt: false } });

export const ComplaintVote = mongoose.model<IComplaintVote>('ComplaintVote', ComplaintVoteSchema);

export interface IFeedback {
    complaint_id: string;
    token: string;
    token_used: boolean;
    rating?: number;
    comment?: string;
    submitted_at?: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
    complaint_id: { type: String, ref: 'Complaint' },
    token: { type: String, unique: true },
    token_used: { type: Boolean, default: false },
    rating: { type: Number },
    comment: { type: String },
}, { timestamps: { createdAt: 'submitted_at' } });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export interface IComplaintCollaborator {
    complaint_id: string;
    department: string;
    sub_status: string;
    notes?: string;
    completed_at?: Date;
    assigned_at?: Date;
}

const CollaboratorSchema = new Schema<IComplaintCollaborator>({
    complaint_id: { type: String, ref: 'Complaint', required: true },
    department: { type: String, required: true },
    sub_status: { type: String, default: 'Pending' },
    notes: { type: String },
    completed_at: { type: Date },
}, { timestamps: { createdAt: 'assigned_at' } });

export const ComplaintCollaborator = mongoose.model<IComplaintCollaborator>('ComplaintCollaborator', CollaboratorSchema);
