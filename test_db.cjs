const Database = require('better-sqlite3');
const path = require('path');

try {
    const dbPath = path.resolve(__dirname, 'pscrm.db');
    console.log(`Checking ${dbPath}`);
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    console.log('Tables found:', tables.map(t => t.name).join(', '));

    tables.forEach(table => {
        const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get().count;
        console.log(`Table ${table.name} has ${count} records.`);
        if (count > 0) {
            const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 1`).get();
            console.log(`Sample data for ${table.name}:`, JSON.stringify(sample, null, 2));
        }
    });

    db.close();
} catch (err) {
    console.error('Error during database check:', err.message);
}
