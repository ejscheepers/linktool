# Linktool

A tiny "link in bio" app: one public page on your own domain, with image + title
links that you can schedule, expire and reorder.

Built with React Router, SQLite (better-sqlite3), Drizzle, better-auth and
Tailwind. Images are stored on disk next to the database, so the whole app is a
single container plus one volume.

## Features

- **Public page** at `/` with avatar, title, bio and link cards.
- **Links** with a title, destination URL, square image and drag-and-drop order.
- **Scheduling**: optional *show from* and *hide after* dates. Expired links
  disappear from the page immediately, without any cron job.
- **Click tracking**: every tap goes through `/l/:id`, is stored as its own row
  and counted in the admin.
- **Branding**: background colour, accent colour, and solid / frosted / outline
  link cards, with a live preview.
- **One account only**: `/setup` creates the first admin, then sign-up is closed
  (enforced inside better-auth, not just in the UI).
- **Images** are cropped to squares and converted to WebP on upload (400×400 for
  links, 320×320 for the avatar).

## Getting started

```bash
npm install
cp .env.example .env   # then edit values
npm run dev
```

Open http://localhost:5173/setup and create the admin account. Then add links at
`/admin`, and set your page title, bio and colours at `/admin/profile`.

Migrations run automatically on startup, and `npm run dev` creates `./data/app.db`
on first use.

## Environment

| Variable            | Required | Default                 | Notes                                            |
| ------------------- | -------- | ----------------------- | ------------------------------------------------ |
| `BETTER_AUTH_SECRET`| yes      | dev fallback only       | Long random string. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL`   | yes      | `http://localhost:5173` | Public origin, e.g. `https://links.dailywine.co.za`. |
| `DATABASE_PATH`     | no       | `./data/app.db`         | SQLite file. In Docker: `/data/app.db`.          |
| `UPLOAD_DIR`        | no       | `./data/uploads`        | Where WebP images are written. In Docker: `/data/uploads`. |
| `APP_TIMEZONE`      | no       | `Africa/Johannesburg`   | Timezone used by the date pickers and formatting.|
| `PORT`              | no       | `3000` (serve default)  | Docker sets `8000`.                              |

## How link visibility works

A link is public when all of these are true:

1. it is enabled,
2. `startsAt` is empty or in the past,
3. `expiresAt` is empty or in the future.

The check is part of every query that reads the public page, so there is no
background job to run and an expired link is gone on the next request. The admin
still lists expired links (with an *Expired* badge) so you can extend or reuse
them. The public page is served with `Cache-Control: no-store`.

## Click tracking

Public link cards point at `/l/:id`. That route inserts a row in `click`
(referrer + user agent + timestamp), bumps `link.click_count`, then redirects to
the destination. If the link is disabled or expired the route returns a 404
instead of redirecting.

## Docker

```bash
docker compose up -d --build
```

The compose file mounts a named volume at `/data`. Everything lives there:

- `/data/app.db` — SQLite database (plus `-wal` / `-shm` files)
- `/data/uploads` — cropped images

Back up that volume (or just that folder) and you have a complete backup. To
restore, put the folder back and start the container.

### Deploying on Coolify (or any Docker host)

1. Create the app from this repository, using the `Dockerfile`.
2. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://links.dailywine.co.za`,
   `APP_TIMEZONE=Africa/Johannesburg`, and mount a persistent volume at `/data`.
3. Point DNS for `links.dailywine.co.za` at the server (A record for the IP, or
   a CNAME if you use a proxy) and let Coolify/Traefik issue the TLS certificate.
4. Open `https://links.dailywine.co.za/setup`, create the account, and start
   adding links.

`/resources/up` is a plain-text health endpoint used by the Docker healthcheck.

## Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR                      |
| `npm run build`      | Production build                              |
| `npm run start`      | Serve the production build                    |
| `npm run typecheck`  | Route typegen + TypeScript                    |
| `npm run db:generate`| Generate a migration after editing the schema |
| `npm run db:migrate` | Apply migrations manually                     |

## Project layout

```
app/
  components/        bio page, admin shell, link form, sortable list, UI kit
  lib/
    auth.server.ts   better-auth setup, session helpers, sign-up lock
    links.server.ts  visibility rules, ordering, status
    profile.server.ts singleton page branding
    uploads.server.ts image crop/convert (sharp) + file helpers
    validation.server.ts  zod form parsing
    dates.ts         timezone-aware datetime-local <-> Date
  models/            Drizzle schema (better-auth tables + profile/link/click)
  routes/            public page, redirect + upload resources, admin screens
  utils/db.server.ts SQLite connection, pragmas and auto-migration
drizzle/             generated migrations (run on boot)
```

## Notes

- Only one page (one domain) is served per deployment. Run a second container
  with its own volume if you need another brand.
- The SQLite connection uses WAL mode and foreign keys; clicking a link writes
  one row plus an update in a transaction.
- Uploaded filenames are random (`400-<cuid>.webp`) and validated before being
  read back, so the `/uploads/:file` route cannot escape its directory.
