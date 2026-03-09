import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the database directory exists
const dbPath = path.resolve(__dirname, '../../pscrm.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize Schema
export const initDb = () => {
    console.log('Initializing database schema...');

    // Users Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT NOT NULL,
            department TEXT,
            employeeId TEXT,
            idProof TEXT,
            isVerified INTEGER DEFAULT 0,
            verificationCode TEXT
        )
    `).run();

    // Complaints Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            citizenName TEXT NOT NULL,
            contactInfo TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            department TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            assignedTo TEXT,
            FOREIGN KEY (assignedTo) REFERENCES users(id)
        )
    `).run();

    // Add default admin user
    const adminExists = db.prepare('SELECT 1 FROM users WHERE role = ?').get('Admin');
    if (!adminExists) {
        console.log('Creating default admin user...');
        db.prepare(`
            INSERT INTO users (id, name, email, password, role, isVerified)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run('USR-ADMIN', 'System Admin', 'admin@ps-crm.gov', 'admin123', 'Admin', 1);
        console.log('Default admin user created: admin@ps-crm.gov / admin123');
    }

    console.log('Database schema initialized.');
};


export default db;
