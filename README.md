# Case Study Catalog

A starter template for a public catalog of anything you want to collect examples of, with
a submission form and a password-gated dashboard for approving new entries before they go
live. Fork it, replace the seed data and branding with your own topic, and deploy.

- `GET /` — public catalog (search + facets)
- `GET /submit` — public submission form
- `GET /admin` — password-gated review dashboard (approve / reject / edit / delete)

## How it works

- Your own curated entries ship as `data/seed.json` and are loaded into the database once,
  the first time the server starts against an empty database.
- Public submissions land in the same database with `status = 'pending'` and are invisible
  to `/api/catalog` until approved.
- The admin dashboard (`/admin`) is gated by a single shared password (`ADMIN_PASSWORD`).
  It shows **every** entry — originally-curated and community-submitted alike — with
  approve/reject/edit/delete on any of them, plus an "Add from email" box that publishes
  straight from a pasted notification email, and a "Repository suggestions" list for links
  someone flagged as worth going through by hand.
- Storage is SQLite via Node's built-in `node:sqlite` module — no native build step, no
  separate database service to run.
- Every new submission also fires an email notification (see below) — this is optional
  and skipped silently if not configured.

## Email notifications

Sends via Gmail SMTP (not a new account — reuses whichever Gmail address you designate
as the sender) whenever someone submits through `/submit`. Set three env vars:

| Var | Meaning |
|---|---|
| `GMAIL_USER` | The Gmail address that **sends** the notification |
| `GMAIL_APP_PASSWORD` | An app password for that account (see below) — not your regular Gmail password |
| `NOTIFY_EMAIL` | Where notifications are **delivered** — can be any address, including a different Gmail account or an institutional/shared team inbox |

To get an app password: the `GMAIL_USER` account needs 2-Step Verification turned on
(Google Account → Security), then generate one at
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). It's a
16-character code, not your login password — paste it into `GMAIL_APP_PASSWORD`.

If any of the three vars is missing, the server logs a warning on startup and simply
skips sending — submissions still work normally, they just won't trigger an email.

The recipient doesn't need to be related to the sending account or match any domain —
Gmail SMTP can deliver to any inbox, so pointing `NOTIFY_EMAIL` at an institutional
address works the same as pointing it at a personal one.

Every notification email also includes the submission as a single-line JSON block,
formatted to be pasted straight into the admin dashboard's "Add from email" box (see
below) — the email itself is the durable record of a submission, independent of whether
its row in the database is still there by the time you get to it. The "Add from email" box
also accepts the plain-text part of the email on its own, or the whole email pasted in —
it isn't JSON-only.

## Repository suggestions

`/submit` also has a small secondary form for "I know of a whole page/PDF/collection of
these, not just one" — it takes a URL and an optional note, emails you the same way a
regular submission does, and lists it under "Repository suggestions" in the admin
dashboard. There's no automatic extraction (see the note in `/submit` about why a
published page can't fetch or read an arbitrary URL for you) — you visit the link
yourself, and add whatever qualifies through the normal form or paste box. Mark a
suggestion done once you've gone through it.

## Git persistence for approved entries (avoids the paid Render plan)

Without this, approved entries only exist in the SQLite file, so a host with no
persistent disk (e.g. Render's free tier) loses them on every rebuild. With it, every
approve/edit/delete/reject of **any** entry — originally-curated or community-submitted,
since the admin dashboard can edit or delete either — commits the full current list of
approved entries to `data/community.json` via the GitHub API, including which collection
each one belongs to and whether it was seeded or submitted. Once that first sync has ever
happened, `community.json` becomes the living snapshot of the whole catalog: a freshly
rebuilt instance loads *from it* rather than from the original `seed.json` (which stays
untouched as the initial bootstrap for a repo that's never synced yet).

Writes retry automatically on a conflicting commit (e.g. two syncs landing at nearly the
same moment) by re-reading the current database state and trying again, rather than
silently dropping whichever one loses the race.

| Var | Meaning |
|---|---|
| `GITHUB_TOKEN` | A GitHub personal access token, scoped to just this repo, with **Contents: Read and write** permission |
| `GITHUB_REPO` | `your-username/case-study-catalog` |
| `GITHUB_BRANCH` | Defaults to `main` |

To create the token: GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained tokens → New token → restrict "Repository access" to just this repo, and
under "Permissions" set **Contents** to **Read and write**. Paste the generated token into
`GITHUB_TOKEN` — never into this repo or into chat.

If either var is missing, git syncing is silently skipped (a warning is logged once on
startup) — approving/editing/deleting still works normally, it just won't survive a
from-scratch rebuild without a persistent disk.

**The one gap this doesn't close**: submissions still sitting in *pending* review only
exist in the database until you act on them. The notification email is the safety net for
those — its copy-paste JSON block (see "Add from email" in the admin dashboard) lets you
publish a submission directly even if its row never makes it, without needing the original
row to still exist.

## Local development

```bash
npm install
cp .env.example .env   # then edit ADMIN_PASSWORD, SESSION_SECRET, and the email vars above
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

`render.yaml` runs on Render's **free** tier, which has no persistent disk — the local
SQLite file resets on every rebuild/restart. That's fine here specifically *because* git
persistence (above) is set up: approved entries are re-seeded from `data/community.json`
on every boot, and pending ones are backed up by the notification email. Without
`GITHUB_TOKEN`/`GITHUB_REPO` configured, approved entries would be lost on every restart —
so treat git persistence as required, not optional, if you're staying on the free tier.

If you'd rather not depend on git for this, two alternatives:
- Switch `plan: free` to a paid plan (e.g. `starter`, ~$7/month) and add a `disk:` block
  mounting somewhere like `/var/data`, with `DB_PATH` pointing into it — a real persistent
  disk, no git involvement needed.
- Or swap the storage layer for a free external database (e.g. Turso/libSQL, Neon Postgres)
  — that's a change to `src/db.js`, not the rest of the app.

### Changing the admin password later

In the Render dashboard: your service → **Environment** → edit `ADMIN_PASSWORD` → the
service redeploys with the new value. No code change needed.

## Project layout

```
src/
  server.js   — Express app, routes, session auth
  db.js       — schema, seed import (seed.json + community.json), all queries
  mailer.js   — Gmail SMTP notification on new submissions
  gitStore.js — commits data/community.json to GitHub on approve/edit/delete
public/
  catalog.html — public browse/search page (fetches /api/catalog)
  submit.html  — public submission form (posts to /api/submissions)
  admin.html   — password-gated review dashboard + "Add from email" box
  shared.css   — shared design system used by all three pages
data/
  seed.json      — your curated entries, imported once on first boot
  community.json — approved community submissions, kept in sync by gitStore.js
```
