import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: string;
    department?: string;
    isVerified: boolean;
    verificationCode?: string;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String },
    role: { type: String, required: true },
    department: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    isApproved: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
