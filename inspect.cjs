const Database = require('better-sqlite3');
const path = require('path');

try {
    const dbPath = path.resolve(__dirname, 'pscrm.db');
    console.log(`Checking ${dbPath}`);
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables);

    tables.forEach(table => {
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        console.log(`Columns for ${table.name}:`, columns);

        // Sample data
        const data = db.prepare(`SELECT * FROM ${table.name} LIMIT 1`).get();
        console.log(`Sample data for ${table.name}:`, data);
    });
} catch (err) {
    console.error('Error:', err.message);
}
