export enum ComplaintStatus {
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
}

export enum ComplaintPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  URGENT = "Urgent",
}

export interface Complaint {
  id: string;
  citizenName: string;
  contactInfo: string;
  category: string;
  description: string;
  department: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  ai_priority?: string;
  sentiment_score?: number;
  urgency_level?: string;
  estimated_resolution_days?: number;
  ai_summary?: string;
  ai_tags?: string; // stored as JSON string in DB, might come as array from API
  recommended_department?: string;
  ai_resolution_steps?: string; // stored as JSON string
  sla_deadline?: string;
  sla_status?: string;
  escalation_level?: number;
  vote_count?: number;
  is_cluster_head?: number;
  source?: string;
  citizen_phone?: string;
  citizen_id?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  complaint_image?: string;
  citizen_email?: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export enum UserRole {
  ADMIN = "Admin",
  OFFICER = "Officer",
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only on backend
  role: UserRole;
  department?: string; // For officers
  isVerified?: boolean;
  verificationCode?: string;
  verificationExpiry?: string | Date;
  isApproved?: boolean;
}
