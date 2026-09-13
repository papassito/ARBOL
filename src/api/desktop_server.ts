import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SQL_SCHEMA } from '../database/schema.js';
import { startWebServer } from './server.js';

const baseDir = process.cwd();
const dbDir = path.join(baseDir, 'backups');
const blobDir = path.join(baseDir, 'blob_store', 'photos');

fs.mkdirSync(dbDir, { recursive: true });
fs.mkdirSync(blobDir, { recursive: true });

const dbPath = path.join(dbDir, 'arbol_dev.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(SQL_SCHEMA);

startWebServer(db, 3000);

const close = () => {
  try { db.close(); } catch {}
  process.exit(0);
};

process.on('SIGINT', close);
process.on('SIGTERM', close);
process.on('uncaughtException', (err) => {
  console.error('[ARBOl API] Error no controlado:', err);
  try { db.close(); } catch {}
  process.exit(1);
});

console.log(`[ARBOl API] Base local activa: ${dbPath}`);
