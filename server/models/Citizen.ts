import mongoose, { Schema, Document } from 'mongoose';

export interface ICitizen extends Document {
    name: string;
    email: string;
    phone?: string;
    password_hash: string;
    ward?: string;
    total_points: number;
    total_complaints: number;
    badges: string[];
    isVerified: boolean;
    verificationCode?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CitizenSchema = new Schema<ICitizen>({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    password_hash: { type: String, required: true },
    ward: { type: String },
    total_points: { type: Number, default: 0 },
    total_complaints: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
}, { timestamps: true });

export const Citizen = mongoose.model<ICitizen>('Citizen', CitizenSchema);
