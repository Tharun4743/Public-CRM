import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    user_id?: mongoose.Types.ObjectId;
    complaint_id?: mongoose.Types.ObjectId | string;
    type: string;
    message: string;
    is_read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    complaint_id: { type: Schema.Types.Mixed, ref: 'Complaint' },
    type: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export interface IAuditLog extends Document {
    user_id?: string;
    user_role?: string;
    action: string;
    complaint_id?: mongoose.Types.ObjectId | string;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    user_id: { type: String },
    user_role: { type: String },
    action: { type: String, required: true },
    complaint_id: { type: Schema.Types.Mixed, ref: 'Complaint' },
    old_value: { type: String },
    new_value: { type: String },
    ip_address: { type: String },
}, { timestamps: true });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export interface IAnomalyAlert extends Document {
    category?: string;
    area?: string;
    spike_magnitude?: string;
    ai_suggestion?: string;
    is_acknowledged: boolean;
    acknowledged_by?: mongoose.Types.ObjectId;
    acknowledged_at?: Date;
    detected_at: Date;
}

const AnomalyAlertSchema = new Schema<IAnomalyAlert>({
    category: { type: String },
    area: { type: String },
    spike_magnitude: { type: String },
    ai_suggestion: { type: String },
    is_acknowledged: { type: Boolean, default: false },
    acknowledged_by: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledged_at: { type: Date }
}, { timestamps: { createdAt: 'detected_at', updatedAt: false } });

export const AnomalyAlert = mongoose.model<IAnomalyAlert>('AnomalyAlert', AnomalyAlertSchema);
