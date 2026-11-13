import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "@/models/schema.server";

const configuredPath = process.env.DATABASE_PATH?.trim();
const databasePath = path.resolve(
  configuredPath || path.join(process.cwd(), "data", "database.sqlite")
);

// A relative DATABASE_PATH resolves against the container's WORKDIR, not the
// mounted volume, so every deploy starts from an empty database. Fail loudly
// instead of letting that happen quietly.
if (
  process.env.NODE_ENV === "production" &&
  configuredPath &&
  !path.isAbsolute(configuredPath)
) {
  console.warn(
    `[linktool] DATABASE_PATH="${configuredPath}" is relative and resolves to ${databasePath} inside the container. ` +
      `Set an absolute path (for example /data/database.sqlite) so the database lives on the mounted volume.`
  );
}

console.log(`[linktool] database: ${databasePath}`);

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
