import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { timeZoneLabel } from "@/lib/env.shared";
import type {
  LinkFormErrors,
  LinkFormValues,
} from "@/lib/validation.server";

type LinkFormProps = {
  defaultValues: LinkFormValues;
  errors?: LinkFormErrors;
  imageUrl?: string | null;
  submitLabel: string;
  cancelHref?: string;
  extra?: React.ReactNode;
};

export function LinkForm({
  defaultValues,
  errors,
  imageUrl,
  submitLabel,
  cancelHref = "/admin",
  extra,
}: LinkFormProps) {
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    if (!file) {
      setPreview(imageUrl ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    previewUrl.current = objectUrl;
    setPreview(objectUrl);
  }

  return (
    <Form method="post" encType="multipart/form-data" className="space-y-6">
      {errors?.form ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.form}
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Link</h2>
          <p className="text-xs text-slate-500">
            The title and image people see. The image is cropped to a square.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="shrink-0">
            <label
              htmlFor="image"
              className="group flex size-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-slate-50 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
            >
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs">
                  <ImagePlus className="size-6" />
                  Add image
                </span>
              )}
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              className="sr-only"
              onChange={onFileChange}
            />
            <p className="mt-2 max-w-28 text-center text-[11px] leading-tight text-slate-500">
              {imageUrl ? "Choose a new image to replace it." : "JPG, PNG or WebP up to 10 MB."}
            </p>
            {errors?.image ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.image}
              </p>
            ) : null}
          </div>

          <div className="grid flex-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                maxLength={120}
                required
                placeholder="New harvest, new wine"
                defaultValue={defaultValues.title}
              />
              {errors?.title ? (
                <p className="text-xs font-medium text-red-600">{errors.title}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">Destination URL</Label>
              <Input
                id="url"
                name="url"
                inputMode="url"
                required
                placeholder="https://dailywine.co.za/shop"
                defaultValue={defaultValues.url}
              />
              {errors?.url ? (
                <p className="text-xs font-medium text-red-600">{errors.url}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  If you leave out https:// we&apos;ll add it for you.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Visibility</h2>
          <p className="text-xs text-slate-500">
            Times are in {timeZoneLabel}. Leave the dates empty to keep the link
            live indefinitely.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={defaultValues.enabled}
            className="mt-0.5 size-4"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">
              Show on the page
            </span>
            <span className="block text-xs text-slate-500">
              Turn this off to hide the link without deleting it.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="startsAt">Show from</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={defaultValues.startsAt}
            />
            {errors?.startsAt ? (
              <p className="text-xs font-medium text-red-600">
                {errors.startsAt}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expiresAt">Hide after</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              defaultValue={defaultValues.expiresAt}
            />
            {errors?.expiresAt ? (
              <p className="text-xs font-medium text-red-600">
                {errors.expiresAt}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                The link disappears from the page at this time.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button asChild type="button" variant="ghost">
          <Link to={cancelHref}>Cancel</Link>
        </Button>
        {extra ? <div className="ml-auto">{extra}</div> : null}
      </div>
    </Form>
  );
}
