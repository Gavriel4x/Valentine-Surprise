import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// FIX __dirname FOR ES MODULE
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB PATH
const dbPath = path.join(__dirname, "../db.sqlite");

// CONNECT DB
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// INIT TABLE
db.run(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    sender_name TEXT NOT NULL,
    target_name TEXT NOT NULL,
    message TEXT,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
