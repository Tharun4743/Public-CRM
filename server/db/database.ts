import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../pscrm.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 30000000000');
db.pragma('page_size = 4096');
db.pragma('cache_size = -16000'); // 16MB cache

export const initDb = () => {
    console.log('Initializing database schema...');

    // ==========================================
    // PHASE 1: TABLE CREATION (CORE ENTITIES)
    // ==========================================

    // 1. Core Users & Authentication
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT NOT NULL,
            department TEXT,
            isVerified INTEGER DEFAULT 0,
            verificationCode TEXT,
            isApproved INTEGER DEFAULT 0
        )
    `).run();

    db.exec(`
      CREATE TABLE IF NOT EXISTS citizens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        ward TEXT,
        total_points INTEGER DEFAULT 0,
        total_complaints INTEGER DEFAULT 0,
        badges TEXT DEFAULT '[]',
        isVerified INTEGER DEFAULT 0,
        verificationCode TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 2. Main Service Entities
    db.exec(`
      CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        citizenName TEXT NOT NULL,
        contactInfo TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        department TEXT,
        status TEXT DEFAULT 'Pending',
        priority TEXT DEFAULT 'Medium',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        assignedTo TEXT,
        ai_priority TEXT,
        sentiment_score REAL,
        urgency_level TEXT,
        estimated_resolution_days INTEGER,
        ai_summary TEXT,
        ai_tags TEXT,
        ai_resolution_steps TEXT,
        recommended_department TEXT,
        sla_deadline TEXT,
        sla_status TEXT,
        escalation_level INTEGER DEFAULT 0,
        vote_count INTEGER DEFAULT 1,
        is_cluster_head INTEGER DEFAULT 0,
        resolution_proof TEXT,
        resolution_notes TEXT,
        resolved_at TEXT,
        resolved_by_officer_id INTEGER,
        satisfaction_score INTEGER,
        feedback_submitted INTEGER DEFAULT 0
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS complaint_votes (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        citizen_email TEXT NOT NULL,
        voted_at TEXT NOT NULL,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        complaint_id TEXT,
        token TEXT UNIQUE,
        token_used INTEGER DEFAULT 0,
        rating INTEGER,
        comment TEXT,
        submitted_at TEXT,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS complaint_collaborators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        assigned_at TEXT NOT NULL,
        sub_status TEXT DEFAULT 'Pending',
        notes TEXT,
        completed_at TEXT,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
      )
    `);

    // 3. System Auditing & Alerts
    db.exec(`
      CREATE TABLE IF NOT EXISTS anomaly_alerts (
        id TEXT PRIMARY KEY,
        detected_at TEXT,
        category TEXT,
        area TEXT,
        spike_magnitude TEXT,
        ai_suggestion TEXT,
        is_acknowledged INTEGER DEFAULT 0,
        acknowledged_by INTEGER,
        acknowledged_at TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_role TEXT,
        action TEXT,
        complaint_id TEXT,
        old_value TEXT,
        new_value TEXT,
        ip_address TEXT,
        created_at TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        complaint_id TEXT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);

    // 4. Gamification & Rewards
    db.exec(`
      CREATE TABLE IF NOT EXISTS points_history (
        id TEXT PRIMARY KEY,
        citizen_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        reason TEXT NOT NULL,
        complaint_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (citizen_id) REFERENCES citizens(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS voucher_types (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        total_available INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id TEXT PRIMARY KEY,
        citizen_id INTEGER NOT NULL,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        is_redeemed INTEGER DEFAULT 0,
        redeemed_at TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (citizen_id) REFERENCES citizens(id)
      )
    `);

    // 5. Reporting & SLA Logic
    db.exec(`
      CREATE TABLE IF NOT EXISTS report_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dimensions TEXT NOT NULL,
        metrics TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER NOT NULL,
        frequency TEXT NOT NULL,
        recipients TEXT NOT NULL,
        last_run_at TEXT,
        next_run_at TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (config_id) REFERENCES report_configs(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS sla_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        priority TEXT,
        department_id INTEGER,
        sla_hours INTEGER NOT NULL,
        escalation_l1_hours INTEGER NOT NULL,
        escalation_l2_hours INTEGER NOT NULL,
        escalation_l3_hours INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS escalations (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        escalated_at TEXT NOT NULL,
        escalation_level INTEGER NOT NULL,
        reason TEXT,
        notified_email TEXT,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
      )
    `);

    // ==========================================
    // PHASE 2: NON-DESTRUCTIVE MIGRATIONS
    // ==========================================

    // Migrate Complaints Table
    const columns = db.prepare('PRAGMA table_info(complaints)').all() as any[];
    const columnNames = columns.map(c => c.name);

    const newColumns = [
        { name: 'ai_priority', type: 'TEXT' },
        { name: 'sentiment_score', type: 'INTEGER' },
        { name: 'urgency_level', type: 'TEXT' },
        { name: 'estimated_resolution_days', type: 'INTEGER' },
        { name: 'ai_summary', type: 'TEXT' },
        { name: 'ai_tags', type: 'TEXT' },
        { name: 'recommended_department', type: 'TEXT' },
        { name: 'ai_resolution_steps', type: 'TEXT' },
        { name: 'sla_deadline', type: 'TEXT' },
        { name: 'sla_status', type: 'TEXT' },
        { name: 'escalation_level', type: 'INTEGER DEFAULT 0' },
        { name: 'vote_count', type: 'INTEGER DEFAULT 1' },
        { name: 'is_cluster_head', type: 'INTEGER DEFAULT 0' },
        { name: 'resolution_proof', type: 'TEXT' },
        { name: 'resolution_notes', type: 'TEXT' },
        { name: 'resolved_at', type: 'TEXT' },
        { name: 'resolved_by_officer_id', type: 'INTEGER' },
        { name: 'satisfaction_score', type: 'INTEGER' },
        { name: 'feedback_submitted', type: 'INTEGER DEFAULT 0' },
        { name: 'source', type: "TEXT DEFAULT 'web'" },
        { name: 'citizen_phone', type: 'TEXT' },
        { name: 'citizen_id', type: 'INTEGER' },
        { name: 'latitude', type: 'REAL' },
        { name: 'longitude', type: 'REAL' },
        { name: 'address', type: 'TEXT' },
        { name: 'complaint_image', type: 'TEXT' },
        { name: 'citizen_email', type: 'TEXT' }
    ];

    newColumns.forEach(col => {
        if (!columnNames.includes(col.name)) {
            db.prepare(`ALTER TABLE complaints ADD COLUMN ${col.name} ${col.type}`).run();
        }
    });

    // Migrate Citizens Table
    const citizenCols = db.prepare('PRAGMA table_info(citizens)').all() as any[];
    const citizenColNames = citizenCols.map(c => c.name);
    
    if (!citizenColNames.includes('total_points')) {
        db.prepare('ALTER TABLE citizens ADD COLUMN total_points INTEGER DEFAULT 0').run();
    }
    if (!citizenColNames.includes('total_complaints')) {
        db.prepare('ALTER TABLE citizens ADD COLUMN total_complaints INTEGER DEFAULT 0').run();
    }
    if (!citizenColNames.includes('badges')) {
        db.prepare("ALTER TABLE citizens ADD COLUMN badges TEXT DEFAULT '[]'").run();
    }
    if (!citizenColNames.includes('isVerified')) {
        db.prepare("ALTER TABLE citizens ADD COLUMN isVerified INTEGER DEFAULT 0").run();
    }
    if (!citizenColNames.includes('verificationCode')) {
        db.prepare("ALTER TABLE citizens ADD COLUMN verificationCode TEXT").run();
    }

    // Migrate Users Table
    const userCols = db.prepare('PRAGMA table_info(users)').all() as any[];
    const userColNames = userCols.map(c => c.name);
    
    if (!userColNames.includes('isApproved')) {
        db.prepare("ALTER TABLE users ADD COLUMN isApproved INTEGER DEFAULT 0").run();
        // Auto-approve existing admins
        db.prepare("UPDATE users SET isApproved = 1 WHERE role = 'Admin'").run();
    }

    // ==========================================
    // PHASE 3: SEED DEFAULT DATA
    // ==========================================

    const rulesCount = db.prepare('SELECT COUNT(*) as count FROM sla_rules').get() as any;
    if (!rulesCount?.count) {
      const seedRule = db.prepare(`
        INSERT INTO sla_rules (
          category, priority, department_id, sla_hours,
          escalation_l1_hours, escalation_l2_hours, escalation_l3_hours,
          is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      seedRule.run(null, 'Urgent', null, 4, 1, 2, 4, 1, 'system', new Date().toISOString());
      seedRule.run(null, 'High', null, 24, 2, 4, 6, 1, 'system', new Date().toISOString());
      seedRule.run(null, 'Medium', null, 72, 4, 8, 12, 1, 'system', new Date().toISOString());
      seedRule.run(null, 'Low', null, 168, 8, 16, 24, 1, 'system', new Date().toISOString());
    }

    console.log("Database initialized successfully");
    const adminExists = db.prepare('SELECT 1 FROM users WHERE role = ?').get('Admin');
    if (!adminExists) {
        console.log('Creating default admin user...');
        db.prepare(`
            INSERT INTO users (id, name, email, password, role, isVerified, isApproved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('USR-ADMIN', 'System Admin', 'admin@ps-crm.gov', 'admin123', 'Admin', 1, 1);
        console.log('Default admin user created: admin@ps-crm.gov / admin123');
    }
};

export default db;
