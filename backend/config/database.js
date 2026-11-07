const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbPath = path.join(dbDir, 'tushudiary.sqlite');
const legacyDbPath = path.join(dbDir, 'tushuledger.sqlite');
if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
  try {
    fs.copyFileSync(legacyDbPath, dbPath);
  } catch (e) {
    dbPath = legacyDbPath;
  }
}
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      user_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      role TEXT DEFAULT 'USER',
      is_premium INTEGER DEFAULT 0,
      premium_activated_at DATETIME,
      premium_utr TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table', err.message);
      } else {
        // Safe migration if table already existed without is_premium
        db.run(`ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN premium_activated_at DATETIME`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN premium_utr TEXT`, () => {});
      }
    });

    // PRAGMA foreign_keys = ON is required in SQLite for cascading deletes to work.
    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 499,
      currency TEXT DEFAULT 'INR',
      payment_method TEXT DEFAULT 'UPI',
      upi_id TEXT NOT NULL,
      utr_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      lifetime INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating payments table', err.message);
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      record_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Error creating records table', err.message);
      }
    });
  }
});

module.exports = db;
