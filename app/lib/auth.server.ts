import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { count } from "drizzle-orm";
import { redirect } from "react-router";

import {
  account,
  session,
  user,
  verification,
} from "@/models/schema.server";
import { db } from "@/utils/db.server";
import { authSecret, authUrl } from "./env.server";
import { trustedOrigins } from "./origins";

/**
 * Sign-up is only open while the database has no users. That covers the very
 * first account (created through /setup) and blocks everyone else, including
 * direct POSTs to /api/auth/sign-up/email.
 */
export function hasUser(): boolean {
  const row = db.select({ value: count() }).from(user).get();
  return (row?.value ?? 0) > 0;
}

export const auth = betterAuth({
  baseURL: authUrl,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  trustedOrigins: trustedOrigins(authUrl),
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          if (hasUser()) {
            throw new APIError("FORBIDDEN", {
              message: "Sign-ups are closed. Only one account is allowed.",
            });
          }
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

/** Copy the auth response's Set-Cookie headers onto a redirect/response. */
export function copySetCookies(from: Response): Headers {
  const headers = new Headers();
  const cookies = from.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }
  if (cookies.length === 0) {
    const cookie = from.headers.get("set-cookie");
    if (cookie) headers.append("Set-Cookie", cookie);
  }
  return headers;
}

export async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

/** Throw a redirect to /login (keeping the current path) when signed out. */
export async function requireUser(request: Request) {
  const session = await getSession(request);
  if (!session) {
    const url = new URL(request.url);
    const next = `${url.pathname}${url.search}`;
    throw redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}

/** Only allow same-site relative paths as a post-login destination. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }
  return next;
}

/** Pull a human-readable message out of a better-auth API error. */
export function authErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const body = (error as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}
