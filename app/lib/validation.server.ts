import { z } from "zod";

import { BUTTON_STYLES } from "./constants";
import { zonedInputToDate } from "./dates";

export type LinkFormValues = {
  title: string;
  description: string;
  url: string;
  startsAt: string;
  expiresAt: string;
  enabled: boolean;
};

export type LinkFormErrors = Partial<
  Record<keyof LinkFormValues | "image" | "form", string>
>;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Give the link a title.")
  .max(120, "Keep the title under 120 characters.");

const descriptionSchema = z
  .string()
  .trim()
  .max(280, "Keep the description under 280 characters.");

const urlSchema = z
  .string()
  .trim()
  .min(1, "Add a destination URL.")
  .max(2048, "That URL is too long.");

function normalizeUrl(value: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.includes("://")) {
    // e.g. mailto:hello@example.com
    return value;
  }
  return `https://${value}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function readLinkValues(formData: FormData): LinkFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    expiresAt: String(formData.get("expiresAt") ?? ""),
    enabled: formData.get("enabled") !== null,
  };
}

export type ParsedLink = {
  title: string;
  description: string;
  url: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  enabled: boolean;
};

export function parseLinkValues(
  values: LinkFormValues
): { ok: true; data: ParsedLink } | { ok: false; errors: LinkFormErrors } {
  const errors: LinkFormErrors = {};

  const title = titleSchema.safeParse(values.title);
  if (!title.success) errors.title = title.error.issues[0]?.message;

  const description = descriptionSchema.safeParse(values.description);
  if (!description.success)
    errors.description = description.error.issues[0]?.message;

  const rawUrl = urlSchema.safeParse(values.url);
  let url = "";
  if (!rawUrl.success) {
    errors.url = rawUrl.error.issues[0]?.message;
  } else {
    url = normalizeUrl(rawUrl.data);
    if (!isHttpUrl(url)) {
      errors.url = "Enter a valid http:// or https:// address.";
    }
  }

  let startsAt: Date | null = null;
  if (values.startsAt.trim()) {
    startsAt = zonedInputToDate(values.startsAt);
    if (!startsAt) errors.startsAt = "That start date is not valid.";
  }

  let expiresAt: Date | null = null;
  if (values.expiresAt.trim()) {
    expiresAt = zonedInputToDate(values.expiresAt);
    if (!expiresAt) errors.expiresAt = "That end date is not valid.";
  }

  if (startsAt && expiresAt && expiresAt.getTime() <= startsAt.getTime()) {
    errors.expiresAt = "The end date must be after the start date.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      title: values.title.trim(),
      description: values.description.trim(),
      url,
      startsAt,
      expiresAt,
      enabled: values.enabled,
    },
  };
}

/* ------------------------------- profile ---------------------------------- */

export type ProfileFormValues = {
  title: string;
  bio: string;
  backgroundColor: string;
  accentColor: string;
  buttonStyle: string;
};

export type ProfileFormErrors = Partial<
  Record<keyof ProfileFormValues | "avatar" | "form", string>
>;

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #1f2937.");

export function readProfileValues(formData: FormData): ProfileFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    backgroundColor: String(formData.get("backgroundColor") ?? ""),
    accentColor: String(formData.get("accentColor") ?? ""),
    buttonStyle: String(formData.get("buttonStyle") ?? ""),
  };
}

export function parseProfileValues(values: ProfileFormValues):
  | { ok: true; data: ProfileFormValues }
  | { ok: false; errors: ProfileFormErrors } {
  const errors: ProfileFormErrors = {};

  const title = z
    .string()
    .trim()
    .min(1, "Add a page title.")
    .max(80, "Keep the title under 80 characters.")
    .safeParse(values.title);
  if (!title.success) errors.title = title.error.issues[0]?.message;

  const bio = z
    .string()
    .trim()
    .max(280, "Keep the bio under 280 characters.")
    .safeParse(values.bio);
  if (!bio.success) errors.bio = bio.error.issues[0]?.message;

  const background = hexColor.safeParse(values.backgroundColor);
  if (!background.success) errors.backgroundColor = background.error.issues[0]?.message;

  const accent = hexColor.safeParse(values.accentColor);
  if (!accent.success) errors.accentColor = accent.error.issues[0]?.message;

  const style = z
    .enum(BUTTON_STYLES)
    .safeParse(values.buttonStyle);
  if (!style.success) errors.buttonStyle = "Pick a button style.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      title: values.title.trim(),
      bio: values.bio.trim(),
      backgroundColor: values.backgroundColor.trim().toLowerCase(),
      accentColor: values.accentColor.trim().toLowerCase(),
      buttonStyle: values.buttonStyle,
    },
  };
}
