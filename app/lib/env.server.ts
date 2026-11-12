/**
 * Environment handling. Everything has a sensible local default so `npm run
 * dev` works with no setup, but production values come from real env vars.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const authSecret = required(
  "BETTER_AUTH_SECRET",
  process.env.NODE_ENV === "production"
    ? undefined
    : "dev-only-secret-change-me-000000000000"
);

export const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";

export const nodeEnv = process.env.NODE_ENV || "development";

export const isProduction = nodeEnv === "production";
