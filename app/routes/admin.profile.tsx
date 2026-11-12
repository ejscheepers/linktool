import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, data } from "react-router";

import { BioPage, type BioLink } from "@/components/bio-page";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth.server";
import {
  BUTTON_STYLE_LABELS,
  BUTTON_STYLES,
  type ButtonStyle,
} from "@/lib/constants";
import { getProfile, updateProfile } from "@/lib/profile.server";
import { deleteImage, imageUrl, saveImage } from "@/lib/uploads.server";
import {
  parseProfileValues,
  readProfileValues,
  type ProfileFormErrors,
} from "@/lib/validation.server";
import type { Route } from "./+types/admin.profile";

export const meta: Route.MetaFunction = () => [{ title: "Page settings" }];

const SAMPLE_LINKS: BioLink[] = [
  { id: "sample-1", title: "New harvest, new wine", imageUrl: null },
  { id: "sample-2", title: "Book a tasting", imageUrl: null },
  { id: "sample-3", title: "Join the wine club", imageUrl: null },
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const profile = getProfile();

  return {
    profile: {
      title: profile.title,
      bio: profile.bio,
      avatarUrl: imageUrl(profile.avatarPath),
      backgroundColor: profile.backgroundColor,
      accentColor: profile.accentColor,
      buttonStyle: profile.buttonStyle,
      avatarPath: profile.avatarPath,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const values = readProfileValues(formData);
  const parsed = parseProfileValues(values);

  if (!parsed.ok) {
    return data({ errors: parsed.errors }, { status: 400 });
  }

  const current = getProfile();
  let avatarPath = current.avatarPath;

  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    const avatar = await saveImage(file, 320);
    if (!avatar.ok) {
      const errors: ProfileFormErrors = { avatar: avatar.error };
      return data({ errors }, { status: 400 });
    }
    avatarPath = avatar.filename;
    deleteImage(current.avatarPath);
  }

  updateProfile({
    title: parsed.data.title,
    bio: parsed.data.bio,
    avatarPath,
    backgroundColor: parsed.data.backgroundColor,
    accentColor: parsed.data.accentColor,
    buttonStyle: parsed.data.buttonStyle,
  });

  return { saved: true };
}

export default function ProfileSettings({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const initial = loaderData.profile;

  const [title, setTitle] = useState(initial.title);
  const [bio, setBio] = useState(initial.bio);
  const [backgroundColor, setBackgroundColor] = useState(
    initial.backgroundColor
  );
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [buttonStyle, setButtonStyle] = useState(initial.buttonStyle);

  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    if (!file) {
      setAvatarUrl(initial.avatarUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    previewUrl.current = objectUrl;
    setAvatarUrl(objectUrl);
  }

  const errors =
    actionData && "errors" in actionData ? actionData.errors : undefined;
  const saved = actionData && "saved" in actionData ? actionData.saved : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page settings"
        description="Your name, bio, colours and avatar. The preview updates as you type."
      />

      {saved ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Saved. Your public page is up to date.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Form
          method="post"
          encType="multipart/form-data"
          className="space-y-5 rounded-2xl border bg-white p-5"
        >
          {errors?.form ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.form}
            </p>
          ) : null}

          <div className="flex items-center gap-4">
            <label
              htmlFor="avatar"
              className="group flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-slate-50 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-6" />
              )}
            </label>
            <div>
              <Label htmlFor="avatar">Avatar</Label>
              <p className="mt-1 text-xs text-slate-500">
                Square image, cropped to a circle. JPG, PNG or WebP.
              </p>
              <input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                className="sr-only"
                onChange={onAvatarChange}
              />
              {errors?.avatar ? (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.avatar}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              maxLength={80}
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            {errors?.title ? (
              <p className="text-xs font-medium text-red-600">{errors.title}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              maxLength={280}
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            <p className="text-xs text-slate-500">{bio.length}/280 characters</p>
            {errors?.bio ? (
              <p className="text-xs font-medium text-red-600">{errors.bio}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="backgroundColor">Background</Label>
              <div className="flex items-center gap-2">
                <input
                  id="backgroundColor"
                  name="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-md border bg-white p-1"
                />
                <Input
                  aria-label="Background hex"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              {errors?.backgroundColor ? (
                <p className="text-xs font-medium text-red-600">
                  {errors.backgroundColor}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accentColor">Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accentColor"
                  name="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-md border bg-white p-1"
                />
                <Input
                  aria-label="Accent hex"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              {errors?.accentColor ? (
                <p className="text-xs font-medium text-red-600">
                  {errors.accentColor}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="buttonStyle">Link style</Label>
            <select
              id="buttonStyle"
              name="buttonStyle"
              value={buttonStyle}
              onChange={(event) => setButtonStyle(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {BUTTON_STYLES.map((style) => (
                <option key={style} value={style}>
                  {BUTTON_STYLE_LABELS[style as ButtonStyle]}
                </option>
              ))}
            </select>
            {errors?.buttonStyle ? (
              <p className="text-xs font-medium text-red-600">
                {errors.buttonStyle}
              </p>
            ) : null}
          </div>

          <Button type="submit">Save page</Button>
        </Form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Preview
          </p>
          <div className="pointer-events-none h-[520px] overflow-y-auto rounded-2xl border shadow-sm">
            <BioPage
              preview
              profile={{
                title: title || "Your name",
                bio,
                avatarUrl,
                backgroundColor:
                  /^#[0-9a-fA-F]{6}$/.test(backgroundColor)
                    ? backgroundColor
                    : "#faf7f2",
                accentColor:
                  /^#[0-9a-fA-F]{6}$/.test(accentColor)
                    ? accentColor
                    : "#b45309",
                buttonStyle,
              }}
              links={SAMPLE_LINKS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
