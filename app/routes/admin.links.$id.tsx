import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { Form, data, redirect } from "react-router";

import { LinkForm } from "@/components/link-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth.server";
import { dateToZonedInput } from "@/lib/dates";
import { getLink } from "@/lib/links.server";
import {
  deleteImage,
  imageUrl,
  saveImage,
} from "@/lib/uploads.server";
import {
  parseLinkValues,
  readLinkValues,
} from "@/lib/validation.server";
import { link as linkTable } from "@/models/schema.server";
import { db } from "@/utils/db.server";
import type { Route } from "./+types/admin.links.$id";

export const meta: Route.MetaFunction = () => [{ title: "Edit link" }];

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request);

  const item = getLink(params.id);
  if (!item) throw new Response("Link not found", { status: 404 });

  return {
    link: {
      id: item.id,
      title: item.title,
      url: item.url,
      imageUrl: imageUrl(item.imagePath),
      clickCount: item.clickCount,
      startsAt: dateToZonedInput(item.startsAt),
      expiresAt: dateToZonedInput(item.expiresAt),
      enabled: item.enabled,
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request);

  const item = getLink(params.id);
  if (!item) throw new Response("Link not found", { status: 404 });

  const formData = await request.formData();
  const intent = String(formData.get("_action") ?? "");

  if (intent === "delete") {
    db.delete(linkTable).where(eq(linkTable.id, item.id)).run();
    deleteImage(item.imagePath);
    return redirect("/admin");
  }

  const values = readLinkValues(formData);
  const parsed = parseLinkValues(values);
  if (!parsed.ok) {
    return data({ errors: parsed.errors }, { status: 400 });
  }

  let imagePath = item.imagePath;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const image = await saveImage(file, 400);
    if (!image.ok) {
      return data({ errors: { image: image.error } }, { status: 400 });
    }
    imagePath = image.filename;
    deleteImage(item.imagePath);
  }

  db.update(linkTable)
    .set({
      title: parsed.data.title,
      url: parsed.data.url,
      startsAt: parsed.data.startsAt,
      expiresAt: parsed.data.expiresAt,
      enabled: parsed.data.enabled,
      imagePath,
      updatedAt: new Date(),
    })
    .where(eq(linkTable.id, item.id))
    .run();

  return redirect("/admin");
}

export default function EditLink({ loaderData, actionData }: Route.ComponentProps) {
  const { link } = loaderData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit link"
        description={`${link.clickCount.toLocaleString("en-ZA")} clicks so far.`}
        backHref="/admin"
      />

      <LinkForm
        submitLabel="Save changes"
        defaultValues={{
          title: link.title,
          url: link.url,
          startsAt: link.startsAt,
          expiresAt: link.expiresAt,
          enabled: link.enabled,
        }}
        errors={actionData?.errors}
        imageUrl={link.imageUrl}
      />

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <h2 className="text-sm font-semibold text-red-800">Delete this link</h2>
        <p className="mt-1 text-xs text-red-700/80">
          The link and its click history are removed permanently.
        </p>
        <Form
          method="post"
          className="mt-3"
          onSubmit={(event) => {
            if (!window.confirm("Delete this link permanently?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="_action" value="delete" />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-1.5 size-4" />
            Delete link
          </Button>
        </Form>
      </section>
    </div>
  );
}
