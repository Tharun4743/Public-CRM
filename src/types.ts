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
  employeeId?: string; // For officers
  idProof?: string; // For officers (base64 or filename)
  isVerified?: boolean;
  verificationCode?: string;
}
