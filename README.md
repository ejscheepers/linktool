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

Migrations run automatically on startup, and `npm run dev` creates `./data/database.sqlite`
on first use.

## Environment

| Variable            | Required | Default                 | Notes                                            |
| ------------------- | -------- | ----------------------- | ------------------------------------------------ |
| `BETTER_AUTH_SECRET`| yes      | dev fallback only       | Long random string. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL`   | yes      | `http://localhost:5173` | Public origin, e.g. `https://links.dailywine.co.za`. |
| `DATABASE_PATH`     | no       | `./data/database.sqlite`| SQLite file. In Docker: `/data/database.sqlite`. |
| `UPLOAD_DIR`        | no       | `./data/uploads`        | Where WebP images are written. In Docker: `/data/uploads`. |
| `APP_TIMEZONE`      | no       | `Africa/Johannesburg`   | Timezone used by the date pickers and formatting.|
| `PORT`              | no       | `3000` (serve default)  | Docker sets `8000`.                              |
| `ALLOWED_ACTION_ORIGINS` | no  | primary host            | Extra hosts for React Router action posts. Build-time in Coolify. |
| `TRUSTED_ORIGINS`   | no       | `BETTER_AUTH_URL`       | Extra full origins better-auth should trust (comma-separated). |

`links.dailywine.co.za` is built into `app/lib/origins.ts` as the primary host,
so a standard deploy needs neither of the last two variables.

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

- `/data/database.sqlite` — SQLite database (plus `-wal` / `-shm` files)
- `/data/uploads` — cropped images

Back up that volume (or just that folder) and you have a complete backup. To
restore, put the folder back and start the container.

### Deploying on Coolify

This is the same shape as the other React Router apps: Coolify builds the repo's
`Dockerfile`, injects env vars, and terminates TLS. The difference is that
linktool keeps its state in one volume instead of a standalone Postgres.

**1. Create the resource**

- New Resource → Application → your GitHub repo, branch `main`.
- Build pack: **Dockerfile** (path `/Dockerfile`).
- Ports exposed: **8000** (`EXPOSE 8000` in the image; `PORT=8000` is baked in).
- Health check: enabled, path **`/resources/up`**, port `8000`.

**2. Environment variables (runtime)**

```dotenv
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://links.dailywine.co.za
APP_TIMEZONE=Africa/Johannesburg
```

`DATABASE_PATH` and `UPLOAD_DIR` already default to `/data/…` in the image, so
they can be left out.

**3. Persistent storage**

Add a volume mount to the app:

| Name       | Source (volume) | Destination |
| ---------- | --------------- | ----------- |
| `linktool-data` | named volume | `/data` |

Or create a **SQLite** database resource in Coolify and link it to the app: Coolify
mounts that resource's volume at `/data` and injects
`DATABASE_PATH=/data/database.sqlite`. The image default uses the same filename,
so the app and the database resource can never disagree. If you change the
resource's `SQLITE_DATABASES` name, set `DATABASE_PATH` to match it.

Everything stateful lives in `/data`:

- `/data/database.sqlite` — SQLite database (plus `-wal` / `-shm` files)
- `/data/uploads` — cropped WebP images

No other services are required: no Postgres, no Redis.

**4. Domain and DNS**

Point `links.dailywine.co.za` at the Coolify server (A record, or CNAME if you
proxy through Cloudflare) and add the domain to the app. Coolify/Traefik issues
the certificate. Keep `BETTER_AUTH_URL` on `https://` — better-auth uses it for
cookie security.

**5. First run**

Open `https://links.dailywine.co.za/setup` and create the admin account. The
route closes itself permanently after the first user exists.

#### Notes specific to this setup

- **Keep replicas at 1.** The SQLite file lives on a per-container volume; two
  replicas would drift apart. A link page does not need more than one.
- **Build-time origins.** React Router bakes `allowedActionOrigins` into the
  build. `links.dailywine.co.za` is already in `app/lib/origins.ts`. If you
  deploy to another domain, either edit that constant or set
  `ALLOWED_ACTION_ORIGINS` (and `TRUSTED_ORIGINS`) as **build-time** variables
  in Coolify.
- **Redeploys** keep the volume; the container re-applies Drizzle migrations on
  boot. Migrations are additive, so rolling back the image is safe as long as
  the schema change was additive.
- **Never enable "Delete unused volumes"** in the Coolify server's Docker
  cleanup settings. That job runs `docker volume prune -af`, which deletes this
  database's volume whenever the container happens to be stopped (a stop/start,
  a crash loop, or an overnight stop) — the data is gone for good.

#### Backups

The volume is the backup unit. `npm run db:backup` uses SQLite's online backup
API, so it is safe while the app is running:

```bash
# On the host (uses ./data/database.sqlite)
npm run db:backup

# In the Coolify container (writes /data/backups/app-<timestamp>.db)
docker exec <container> npm run db:backup
```

Copy the resulting file (or the whole volume) somewhere else, and prune old
backups with a scheduled job if you want. Restoring is: stop the app, replace
`/data/database.sqlite` with the backup, start it. If you copy files by hand rather than
using the backup command, take `database.sqlite`, `database.sqlite-wal` and `database.sqlite-shm` together.

If you enable Coolify's volume backup feature on the server, that works too.

`/resources/up` is a plain-text health endpoint used by the Docker healthcheck
and by Coolify.


## Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR                      |
| `npm run build`      | Production build                              |
| `npm run start`      | Serve the production build                    |
| `npm run typecheck`  | Route typegen + TypeScript                    |
| `npm run db:generate`| Generate a migration after editing the schema |
| `npm run db:migrate` | Apply migrations manually                     |
| `npm run db:backup`  | Online SQLite backup into `./data/backups`    |

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
