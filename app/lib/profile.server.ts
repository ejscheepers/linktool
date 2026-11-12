import { eq } from "drizzle-orm";

import { profile, type Profile } from "@/models/schema.server";
import { db } from "@/utils/db.server";

const PROFILE_ID = "main";

const DEFAULTS = {
  id: PROFILE_ID,
  title: "My links",
  bio: "Everything worth clicking, in one place.",
  avatarPath: null,
  backgroundColor: "#faf7f2",
  accentColor: "#b45309",
  buttonStyle: "solid",
  updatedAt: new Date(),
};

export function getProfile(): Profile {
  const existing = db
    .select()
    .from(profile)
    .where(eq(profile.id, PROFILE_ID))
    .get();

  if (existing) return existing;

  db.insert(profile).values(DEFAULTS).run();

  return db
    .select()
    .from(profile)
    .where(eq(profile.id, PROFILE_ID))
    .get()!;
}

export function updateProfile(values: {
  title: string;
  bio: string;
  avatarPath: string | null;
  backgroundColor: string;
  accentColor: string;
  buttonStyle: string;
}): Profile {
  getProfile();
  db.update(profile)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(profile.id, PROFILE_ID))
    .run();
  return getProfile();
}
