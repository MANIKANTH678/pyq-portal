const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data.db'));

// The UNIQUE constraint blocks duplicate papers, and SQLite builds an index
// for it, so filtering by branch, semester and subject is already fast.
db.exec(`
  CREATE TABLE IF NOT EXISTS papers (
    id          INTEGER PRIMARY KEY,
    branch      TEXT    NOT NULL,
    semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    subject     TEXT    NOT NULL,
    year        INTEGER NOT NULL,
    exam_type   TEXT    NOT NULL CHECK (exam_type IN ('main', 'backlog')),
    file_path   TEXT    NOT NULL,
    uploaded_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch, semester, subject, year, exam_type)
  )
`);

module.exports = db;
