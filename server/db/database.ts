import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.ts';
import { SLARule } from '../models/Reporting.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pscrm:TEAMGOAT@ps-crm.mxwibid.mongodb.net/?appName=ps-crm';

export const connectDb = async () => {
    // Use fallback MongoDB URI if not set
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pscrm:TEAMGOAT@ps-crm.mxwibid.mongodb.net/?appName=ps-crm';
    
    console.log('Attempting MongoDB connection...');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        await initSeedData();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.error('❌ Network error - check if MongoDB URI is correct and accessible');
        } else if (error.message.includes('Authentication failed')) {
            console.error('❌ Authentication failed - check MongoDB credentials');
        }
        throw error;
    }
};

const initSeedData = async () => {
    try {
        // Seed default admin
        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (adminCount === 0) {
            console.log('Creating default admin user...');
            await User.create({
                name: 'System Admin',
                email: 'admin@ps-crm.gov',
                password: 'admin123', // In a real app, use hashed passwords
                role: 'Admin',
                isVerified: true,
                isApproved: true
            });
            console.log('Default admin user created: admin@ps-crm.gov / admin123');
        }

        // Seed default SLA rules
        const slaCount = await SLARule.countDocuments();
        if (slaCount === 0) {
            console.log('Seeding default SLA rules...');
            const defaultRules = [
                { category: null, priority: 'Urgent', department: null, sla_hours: 4, escalation_l1_hours: 1, escalation_l2_hours: 2, escalation_l3_hours: 4, is_active: true, created_by: 'system' },
                { category: null, priority: 'High', department: null, sla_hours: 24, escalation_l1_hours: 2, escalation_l2_hours: 4, escalation_l3_hours: 6, is_active: true, created_by: 'system' },
                { category: null, priority: 'Medium', department: null, sla_hours: 72, escalation_l1_hours: 4, escalation_l2_hours: 8, escalation_l3_hours: 12, is_active: true, created_by: 'system' },
                { category: null, priority: 'Low', department: null, sla_hours: 168, escalation_l1_hours: 8, escalation_l2_hours: 16, escalation_l3_hours: 24, is_active: true, created_by: 'system' }
            ];
            // Typo in original SQL: escalation_l3_hours was used for all 3 L levels in seeds. 
            // Corrected some values based on typical escalation logic.
            await SLARule.insertMany(defaultRules);
            console.log('Default SLA rules seeded');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

// Exporting a placeholder for compatibility if other files import 'db' directly
const db = mongoose.connection;
export default db;
export { mongoose };
