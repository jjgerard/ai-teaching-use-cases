# Working preferences for this repo

- Git commits, pushes to `master`, and Fly.io deploys (`flyctl deploy`) for
  this project do **not** need a chat confirmation each time — proceed
  directly rather than asking first. This does not extend to destructive
  operations (force-push, `git reset --hard`, deleting the Fly app/machines,
  dropping data) — those still get flagged before acting.
- Deploy target: Fly.io app `case-study-catalog` (case-study-catalog.fly.dev).
  Auto-deploy is wired via `.github/workflows/fly-deploy.yml` on push to
  `master`, using a `FLY_API_TOKEN` repo secret (a scoped Fly deploy token,
  set 2026-07-23). If that secret ever needs rotating: `flyctl tokens create
  deploy --app case-study-catalog` locally, then update the GitHub Actions
  secret of the same name.
