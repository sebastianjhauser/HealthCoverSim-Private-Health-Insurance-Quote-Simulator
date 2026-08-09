const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'quotes.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    cover_type TEXT NOT NULL,
    applicant1_age INTEGER NOT NULL,
    applicant1_cover_history TEXT NOT NULL,
    applicant2_age INTEGER,
    applicant2_cover_history TEXT,
    hospital_cover TEXT NOT NULL,
    extras_cover TEXT NOT NULL,
    payment_frequency TEXT NOT NULL,
    annual_discount REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;