import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "@/models/schema.server";

const databasePath =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "database.sqlite");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });

// Migrations are idempotent and run once per process. Keeping them here means
// a fresh volume (or a new container) boots straight into a working app.
migrate(db, {
  migrationsFolder: path.join(process.cwd(), "drizzle"),
});
