import mongoose, { Schema, Document } from 'mongoose';

export interface IReportConfig extends Document {
    name: string;
    dimensions: string;
    metrics: string;
    created_by?: string;
    created_at: Date;
}

const ReportConfigSchema = new Schema<IReportConfig>({
    name: { type: String, required: true },
    dimensions: { type: String, required: true },
    metrics: { type: String, required: true },
    created_by: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const ReportConfig = mongoose.model<IReportConfig>('ReportConfig', ReportConfigSchema);

export interface IScheduledReport extends Document {
    config_id: mongoose.Types.ObjectId;
    frequency: string;
    recipients: string;
    last_run_at?: Date;
    next_run_at?: Date;
    is_active: boolean;
}

const ScheduledReportSchema = new Schema<IScheduledReport>({
    config_id: { type: Schema.Types.ObjectId, ref: 'ReportConfig', required: true },
    frequency: { type: String, required: true },
    recipients: { type: String, required: true },
    last_run_at: { type: Date },
    next_run_at: { type: Date },
    is_active: { type: Boolean, default: true }
});

export const ScheduledReport = mongoose.model<IScheduledReport>('ScheduledReport', ScheduledReportSchema);

export interface ISLARule extends Document {
    category?: string;
    priority?: string;
    department?: string;
    sla_hours: number;
    escalation_l1_hours: number;
    escalation_l2_hours: number;
    escalation_l3_hours: number;
    is_active: boolean;
    created_by?: string;
    created_at: Date;
}

const SLARuleSchema = new Schema<ISLARule>({
    category: { type: String },
    priority: { type: String },
    department: { type: String },
    sla_hours: { type: Number, required: true },
    escalation_l1_hours: { type: Number, required: true },
    escalation_l2_hours: { type: Number, required: true },
    escalation_l3_hours: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
    created_by: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const SLARule = mongoose.model<ISLARule>('SLARule', SLARuleSchema);

export interface IEscalation extends Document {
    complaint_id: mongoose.Types.ObjectId | string;
    escalated_at: Date;
    escalation_level: number;
    reason?: string;
    notified_email?: string;
}

const EscalationSchema = new Schema<IEscalation>({
    complaint_id: { type: Schema.Types.Mixed, ref: 'Complaint', required: true },
    escalated_at: { type: Date, required: true },
    escalation_level: { type: Number, required: true },
    reason: { type: String },
    notified_email: { type: String }
});

export const Escalation = mongoose.model<IEscalation>('Escalation', EscalationSchema);
