import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { Link, data } from "react-router";

import { SortableLinkList, type AdminLink } from "@/components/sortable-link-list";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth.server";
import { formatDateShort } from "@/lib/dates";
import {
  getLink,
  linkStatus,
  listAllLinks,
} from "@/lib/links.server";
import { deleteImage, imageUrl } from "@/lib/uploads.server";
import { link as linkTable } from "@/models/schema.server";
import { db } from "@/utils/db.server";
import type { Route } from "./+types/admin._index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const links = listAllLinks();
  const now = new Date();

  const items: AdminLink[] = links.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    imageUrl: imageUrl(item.imagePath),
    status: linkStatus(item, now),
    enabled: item.enabled,
    clickCount: item.clickCount,
    startsAtLabel: item.startsAt ? formatDateShort(item.startsAt) : null,
    expiresAtLabel: item.expiresAt ? formatDateShort(item.expiresAt) : null,
  }));

  return {
    links: items,
    totals: {
      links: links.length,
      live: links.filter((item) => linkStatus(item, now) === "live").length,
      clicks: links.reduce((sum, item) => sum + item.clickCount, 0),
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const intent = String(formData.get("_action") ?? "");
  const id = String(formData.get("id") ?? "");

  if (intent === "reorder") {
    let ids: unknown;
    try {
      ids = JSON.parse(String(formData.get("ids") ?? "[]"));
    } catch {
      return data({ error: "That order could not be saved." }, { status: 400 });
    }

    if (!Array.isArray(ids) || ids.some((value) => typeof value !== "string")) {
      return data({ error: "That order could not be saved." }, { status: 400 });
    }

    db.transaction((tx) => {
      (ids as string[]).forEach((linkId, index) => {
        tx.update(linkTable)
          .set({ position: index, updatedAt: new Date() })
          .where(eq(linkTable.id, linkId))
          .run();
      });
    });

    return { ok: true };
  }

  if (intent === "toggle") {
    if (!id) return data({ error: "Missing link." }, { status: 400 });
    const enabled = String(formData.get("enabled")) === "true";
    db.update(linkTable)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(linkTable.id, id))
      .run();
    return { ok: true };
  }

  if (intent === "delete") {
    if (!id) return data({ error: "Missing link." }, { status: 400 });
    const existing = getLink(id);
    if (existing) {
      db.delete(linkTable).where(eq(linkTable.id, id)).run();
      deleteImage(existing.imagePath);
    }
    return { ok: true };
  }

  return data({ error: "Unknown action." }, { status: 400 });
}

export default function AdminIndex({ loaderData }: Route.ComponentProps) {
  const { links, totals } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totals.links} total · {totals.live} live now ·{" "}
            {totals.clicks.toLocaleString("en-ZA")} clicks
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/links/new">
            <Plus className="mr-2 size-4" />
            Add link
          </Link>
        </Button>
      </div>

      <SortableLinkList links={links} />
    </div>
  );
}
