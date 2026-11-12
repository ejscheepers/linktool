import { data, redirect } from "react-router";

import { LinkForm } from "@/components/link-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth.server";
import { nextPosition } from "@/lib/links.server";
import { saveImage } from "@/lib/uploads.server";
import {
  parseLinkValues,
  readLinkValues,
} from "@/lib/validation.server";
import { link as linkTable } from "@/models/schema.server";
import { db } from "@/utils/db.server";
import type { Route } from "./+types/admin.links.new";

export const meta: Route.MetaFunction = () => [{ title: "New link" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const values = readLinkValues(formData);
  const parsed = parseLinkValues(values);

  if (!parsed.ok) {
    return data({ errors: parsed.errors }, { status: 400 });
  }

  const image = await saveImage(formData.get("image"), 400);
  if (!image.ok) {
    return data({ errors: { image: image.error } }, { status: 400 });
  }

  const now = new Date();
  db.insert(linkTable)
    .values({
      title: parsed.data.title,
      url: parsed.data.url,
      startsAt: parsed.data.startsAt,
      expiresAt: parsed.data.expiresAt,
      enabled: parsed.data.enabled,
      imagePath: image.filename,
      position: nextPosition(),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return redirect("/admin");
}

export default function NewLink({ actionData }: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add a link"
        description="It appears on your page straight away unless you schedule it."
        backHref="/admin"
      />

      <LinkForm
        submitLabel="Add link"
        defaultValues={{
          title: "",
          url: "",
          startsAt: "",
          expiresAt: "",
          enabled: true,
        }}
        errors={actionData?.errors}
      />
    </div>
  );
}
