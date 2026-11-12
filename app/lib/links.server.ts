import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";

import { link, type Link } from "@/models/schema.server";
import { db } from "@/utils/db.server";

export type LinkStatus = "live" | "scheduled" | "expired" | "disabled";

/**
 * A link is public when it is enabled and "now" sits inside its optional
 * start/end window. No cron job needed: expiry is evaluated on every read.
 */
export function liveLinksCondition(now: Date = new Date()) {
  return and(
    eq(link.enabled, true),
    or(isNull(link.startsAt), lte(link.startsAt, now)),
    or(isNull(link.expiresAt), gt(link.expiresAt, now))
  );
}

export function listLiveLinks(now: Date = new Date()): Link[] {
  return db
    .select()
    .from(link)
    .where(liveLinksCondition(now))
    .orderBy(asc(link.position), asc(link.createdAt))
    .all();
}

export function listAllLinks(): Link[] {
  return db
    .select()
    .from(link)
    .orderBy(asc(link.position), asc(link.createdAt))
    .all();
}

export function getLink(id: string): Link | undefined {
  return db.select().from(link).where(eq(link.id, id)).get();
}

export function getLiveLink(id: string, now: Date = new Date()): Link | undefined {
  return db
    .select()
    .from(link)
    .where(and(eq(link.id, id), liveLinksCondition(now)))
    .get();
}

export function linkStatus(item: Link, now: Date = new Date()): LinkStatus {
  if (!item.enabled) return "disabled";
  if (item.startsAt && item.startsAt.getTime() > now.getTime()) return "scheduled";
  if (item.expiresAt && item.expiresAt.getTime() <= now.getTime()) return "expired";
  return "live";
}

export function nextPosition(): number {
  const row = db
    .select({ position: link.position })
    .from(link)
    .orderBy(asc(link.position))
    .all()
    .at(-1);
  return (row?.position ?? 0) + 10;
}
