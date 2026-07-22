require("dotenv").config({ quiet: true });
const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const db = require("./db");
const { notifyNewSubmission } = require("./mailer");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error("Missing ADMIN_PASSWORD or SESSION_SECRET env vars. See .env.example.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 12 },
  })
);
app.use(express.static(path.join(__dirname, "..", "public")));

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  res.status(401).json({ error: "not_authenticated" });
}

// ---- public: catalog data ----
app.get("/api/catalog", (req, res) => {
  res.json({ entries: db.getApprovedEntries(), repos: db.getRepos() });
});

// ---- public: submissions ----
const REQUIRED_FIELDS = ["t", "by", "u", "s"];

app.post("/api/submissions", (req, res) => {
  const body = req.body || {};
  if (!body.attest1 || !body.attest2) {
    return res.status(400).json({ error: "attestation_required" });
  }
  const missing = REQUIRED_FIELDS.filter((f) => !String(body[f] || "").trim());
  if (missing.length) {
    return res.status(400).json({ error: "missing_fields", missing });
  }
  const entry = {
    t: String(body.t).trim().slice(0, 300),
    by: String(body.by).trim().slice(0, 200),
    inst: String(body.inst || "").trim().slice(0, 200),
    u: String(body.u).trim().slice(0, 500),
    reg: String(body.reg || "").trim().slice(0, 100),
    yr: body.yr ? Number(body.yr) || null : null,
    th: String(body.th || "").trim().slice(0, 100),
    disc: Array.isArray(body.disc) ? body.disc.map(String).slice(0, 20) : [],
    tool: Array.isArray(body.tool) ? body.tool.map(String).slice(0, 20) : [],
    s: String(body.s).trim().slice(0, 4000),
  };
  const id = db.insertSubmission(entry);
  res.status(201).json({ id });
  const adminUrl = `${req.protocol}://${req.get("host")}/admin`;
  notifyNewSubmission(entry, adminUrl);
});

// ---- admin: auth ----
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!password || !timingSafeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "invalid_password" });
  }
  req.session.authed = true;
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => {
  res.json({ authed: !!(req.session && req.session.authed) });
});

// ---- admin: review queue (protected) ----
app.get("/api/admin/submissions", requireAuth, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  res.json({ submissions: db.getSubmissions(status) });
});

app.put("/api/admin/submissions/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const updated = db.updateEntry(id, req.body || {});
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json({ entry: updated });
});

app.post("/api/admin/submissions/:id/approve", requireAuth, (req, res) => {
  const entry = db.setStatus(Number(req.params.id), "approved");
  if (!entry) return res.status(404).json({ error: "not_found" });
  res.json({ entry });
});

app.post("/api/admin/submissions/:id/reject", requireAuth, (req, res) => {
  const entry = db.setStatus(Number(req.params.id), "rejected");
  if (!entry) return res.status(404).json({ error: "not_found" });
  res.json({ entry });
});

app.delete("/api/admin/submissions/:id", requireAuth, (req, res) => {
  db.deleteEntry(Number(req.params.id));
  res.json({ ok: true });
});

app.get("/submit", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "submit.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "catalog.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Case study catalog listening on http://localhost:${PORT}`);
});
