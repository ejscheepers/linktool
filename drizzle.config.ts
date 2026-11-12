import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/models/schema.server.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || "./data/app.db",
  },
  strict: true,
  verbose: true,
});
