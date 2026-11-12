/**
 * Consistent SQLite backup using better-sqlite3's online backup API.
 *
 *   npm run db:backup
 *   DATABASE_PATH=/data/app.db npm run db:backup
 *
 * Writes ./backups/app-<timestamp>.db next to the database file.
 */
import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const databasePath =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");

const destinationDir = path.join(path.dirname(databasePath), "backups");
fs.mkdirSync(destinationDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = path.join(destinationDir, `app-${stamp}.db`);

const db = new Database(databasePath, { fileMustExist: true });

try {
  await db.backup(destination);
  console.log(`Backup written to ${destination}`);
} finally {
  db.close();
}
