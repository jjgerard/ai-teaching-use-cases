# Field Notes — Case Study Catalog

A public catalog of real, concrete AI-in-education case studies, with a submission form
and a password-gated dashboard for approving new entries before they go live.

- `GET /` — public catalog (search + facets)
- `GET /submit` — public submission form
- `GET /admin` — password-gated review dashboard (approve / reject / edit / delete)

## How it works

- 159 curated entries ship as `data/seed.json` and are loaded into the database once, the
  first time the server starts against an empty database.
- Public submissions land in the same database with `status = 'pending'` and are invisible
  to `/api/catalog` until approved.
- The admin dashboard (`/admin`) is gated by a single shared password (`ADMIN_PASSWORD`).
  Approve, reject, edit, or permanently delete any submission there.
- Storage is SQLite via Node's built-in `node:sqlite` module — no native build step, no
  separate database service to run.

## Local development

```bash
npm install
cp .env.example .env   # then edit ADMIN_PASSWORD and SESSION_SECRET
npm start
```

Visit `http://localhost:3000` (or whatever `PORT` you set).

## Deploying to Render

1. Push this folder to a GitHub repo.
2. In Render, **New > Blueprint**, point it at the repo — it will read `render.yaml`
   automatically and provision the service.
3. Render will prompt for `ADMIN_PASSWORD` (marked `sync: false` in `render.yaml`, so it's
   never stored in the repo). Set it to whatever password you'll use to log into `/admin`.
   `SESSION_SECRET` is auto-generated.
4. Deploy. First boot seeds the database automatically.

### Important: persistence and cost

`render.yaml` requests Render's **Starter** plan (currently ~$7/month) specifically because
it's the cheapest tier with a **persistent disk** — without one, Render's free tier wipes
the filesystem (and your SQLite database, including anything pending review) on every
redeploy or restart. If you don't want a paid plan:

- Switch `plan: starter` to `plan: free` in `render.yaml` — the app will still work, but you
  risk losing pending/approved submissions whenever Render restarts the instance (which it
  does periodically on the free tier), unless you also move storage to an external database.
- Or swap the storage layer for a free external database (e.g. Turso/libSQL, Neon Postgres)
  if this becomes a real concern — that's a change to `src/db.js`, not the rest of the app.

### Changing the admin password later

In the Render dashboard: your service → **Environment** → edit `ADMIN_PASSWORD` → the
service redeploys with the new value. No code change needed.

## Project layout

```
src/
  server.js   — Express app, routes, session auth
  db.js       — schema, seed import, all queries
public/
  catalog.html — public browse/search page (fetches /api/catalog)
  submit.html  — public submission form (posts to /api/submissions)
  admin.html   — password-gated review dashboard
  shared.css   — shared design system used by all three pages
data/
  seed.json    — the 159 curated entries, imported once on first boot
```
