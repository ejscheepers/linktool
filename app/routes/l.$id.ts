import { eq, sql } from "drizzle-orm";
import { redirect } from "react-router";

import { click, link as linkTable } from "@/models/schema.server";
import { getLiveLink } from "@/lib/links.server";
import { db } from "@/utils/db.server";
import type { Route } from "./+types/l.$id";

/**
 * Every tap goes through here: we log the click (one row per click) and then
 * bounce the visitor on to the destination. Links that are disabled, expired
 * or not started yet are treated as missing.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const id = params.id;
  if (!id) throw new Response("Not found", { status: 404 });

  const target = getLiveLink(id);
  if (!target) {
    throw new Response("This link is no longer available.", { status: 404 });
  }

  const referrer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");

  db.transaction((tx) => {
    tx.insert(click)
      .values({
        linkId: target.id,
        referrer: referrer ? referrer.slice(0, 512) : null,
        userAgent: userAgent ? userAgent.slice(0, 512) : null,
        createdAt: new Date(),
      })
      .run();

    tx.update(linkTable)
      .set({ clickCount: sql`${linkTable.clickCount} + 1` })
      .where(eq(linkTable.id, target.id))
      .run();
  });

  return redirect(target.url, 302);
}
