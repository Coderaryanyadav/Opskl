import Database from 'better-sqlite3';
import { join } from 'path';

// Set the database path
const dbPath = join(process.cwd(), 'opskill.db');

// Create a new database connection
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable memory-mapped I/O for better performance
db.pragma('mmap_size = 30000000000'); // 30GB

export default db;
