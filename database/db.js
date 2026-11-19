
const Database = require("better-sqlite3");

const db = new Database(process.env.DB_PATH || "./freshguard.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

function addColumnIfMissing(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = columns.some(col => col.name === column);

    if (!exists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

addColumnIfMissing("inspections", "size_category", "TEXT");
addColumnIfMissing("inspections", "needs_review", "INTEGER DEFAULT 0");
addColumnIfMissing("inspections", "model_version", "TEXT");
addColumnIfMissing("inspections", "image_url", "TEXT");

db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER NOT NULL UNIQUE,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id)
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS inspection_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME
    )
`);

addColumnIfMissing(
    "inspections",
    "batch_id",
    "INTEGER REFERENCES inspection_batches(id)"
);
addColumnIfMissing("inspections", "line_id", "INTEGER");

module.exports = db;
