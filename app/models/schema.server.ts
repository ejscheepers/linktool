import { createId } from "@paralleldrive/cuid2";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/* -------------------------------------------------------------------------- */
/*                                better-auth                                 */
/* -------------------------------------------------------------------------- */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

/* -------------------------------------------------------------------------- */
/*                                  Profile                                   */
/* -------------------------------------------------------------------------- */

/** Singleton row: the branding and copy of the public bio page. */
export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  bio: text("bio").notNull().default(""),
  avatarPath: text("avatar_path"),
  backgroundColor: text("background_color").notNull().default("#faf7f2"),
  accentColor: text("accent_color").notNull().default("#b45309"),
  buttonStyle: text("button_style").notNull().default("solid"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                   Links                                    */
/* -------------------------------------------------------------------------- */

export const link = sqliteTable(
  "link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    url: text("url").notNull(),
    imagePath: text("image_path").notNull(),
    position: integer("position").notNull().default(0),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    clickCount: integer("click_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("link_position_idx").on(table.position)]
);

export const click = sqliteTable(
  "click",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    linkId: text("link_id")
      .notNull()
      .references(() => link.id, { onDelete: "cascade" }),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("click_link_id_idx").on(table.linkId),
    index("click_created_at_idx").on(table.createdAt),
  ]
);

export type Link = typeof link.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type Click = typeof click.$inferSelect;
