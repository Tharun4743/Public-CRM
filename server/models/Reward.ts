import mongoose, { Schema, Document } from 'mongoose';

export interface IPointHistory extends Document {
    citizen_id: mongoose.Types.ObjectId;
    points: number;
    reason: string;
    complaint_id?: mongoose.Types.ObjectId | string;
    created_at: Date;
}

const PointHistorySchema = new Schema<IPointHistory>({
    citizen_id: { type: Schema.Types.ObjectId, ref: 'Citizen', required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    complaint_id: { type: Schema.Types.Mixed, ref: 'Complaint' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const PointHistory = mongoose.model<IPointHistory>('PointHistory', PointHistorySchema);

export interface IVoucherType extends Document {
    title: string;
    description: string;
    points_required: number;
    total_available: number;
    is_active: boolean;
    created_at: Date;
}

const VoucherTypeSchema = new Schema<IVoucherType>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    points_required: { type: Number, required: true },
    total_available: { type: Number, required: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const VoucherType = mongoose.model<IVoucherType>('VoucherType', VoucherTypeSchema);

export interface IVoucher extends Document {
    citizen_id: mongoose.Types.ObjectId;
    code: string;
    title: string;
    description: string;
    points_required: number;
    is_redeemed: boolean;
    redeemed_at?: Date;
    expires_at: Date;
    created_at: Date;
}

const VoucherSchema = new Schema<IVoucher>({
    citizen_id: { type: Schema.Types.ObjectId, ref: 'Citizen', required: true },
    code: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    points_required: { type: Number, required: true },
    is_redeemed: { type: Boolean, default: false },
    redeemed_at: { type: Date },
    expires_at: { type: Date, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);
