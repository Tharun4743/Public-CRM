import mongoose, { Schema, Document } from 'mongoose';

export interface ICitizen extends Document {
    name: string;
    email: string;
    phone?: string;
    password_hash: string;
    ward?: string;
    address?: string;
    total_points: number;
    total_complaints: number;
    badges: string[];
    isVerified: boolean;
    verificationCode?: string;
    verificationExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CitizenSchema = new Schema<ICitizen>({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password_hash: { type: String, required: true },
    ward: { type: String },
    address: { type: String },
    total_points: { type: Number, default: 0 },
    total_complaints: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpiry: { type: Date }
}, { timestamps: true });

export const Citizen = mongoose.model<ICitizen>('Citizen', CitizenSchema);
