require("dotenv").config({ quiet: true });
const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const db = require("./db");
const {
  notifyNewSubmission,
  notifyNewLead,
  notifyEditRequest,
  sendEditRequestConfirmation,
  sendSubmissionConfirmation,
} = require("./mailer");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { syncApprovedEntriesToGit } = require("./gitStore");

function syncGit() {
  syncApprovedEntriesToGit(() => db.getAllApprovedEntriesForExport());
}

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

function missingRequiredFields(body) {
  return REQUIRED_FIELDS.filter((f) => !String(body[f] || "").trim());
}

function sanitizeEntry(body) {
  return {
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
    ev: String(body.ev || "").trim().slice(0, 2000),
  };
}

app.post("/api/submissions", (req, res) => {
  const body = req.body || {};
  if (!body.attest1 || !body.attest2) {
    return res.status(400).json({ error: "attestation_required" });
  }
  const missing = missingRequiredFields(body);
  if (missing.length) {
    return res.status(400).json({ error: "missing_fields", missing });
  }
  const entry = sanitizeEntry(body);
  const id = db.insertSubmission(entry);
  res.status(201).json({ id });
  const adminUrl = `${req.protocol}://${req.get("host")}/admin`;
  notifyNewSubmission(entry, adminUrl);
  const submitterEmail = String(body.email || "").trim();
  if (EMAIL_RE.test(submitterEmail)) sendSubmissionConfirmation(submitterEmail, entry);
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

// ---- admin: review queue (protected) — every entry, seed or submitted ----
app.get("/api/admin/submissions", requireAuth, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  res.json({ submissions: db.getAllEntries(status) });
});

app.put("/api/admin/submissions/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const updated = db.updateEntry(id, req.body || {});
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json({ entry: updated });
  if (updated.status === "approved") syncGit();
});

app.post("/api/admin/submissions/:id/approve", requireAuth, (req, res) => {
  const entry = db.setStatus(Number(req.params.id), "approved");
  if (!entry) return res.status(404).json({ error: "not_found" });
  res.json({ entry });
  syncGit();
});

app.post("/api/admin/submissions/:id/reject", requireAuth, (req, res) => {
  const entry = db.setStatus(Number(req.params.id), "rejected");
  if (!entry) return res.status(404).json({ error: "not_found" });
  res.json({ entry });
  syncGit();
});

app.delete("/api/admin/submissions/:id", requireAuth, (req, res) => {
  db.deleteEntry(Number(req.params.id));
  res.json({ ok: true });
  syncGit();
});

// Publish an entry straight from a pasted JSON block (e.g. copied out of the
// notification email) — bypasses the review queue entirely, so it works even
// if the original pending row never made it or already got lost.
app.post("/api/admin/publish", requireAuth, (req, res) => {
  const body = req.body || {};
  const missing = missingRequiredFields(body);
  if (missing.length) {
    return res.status(400).json({ error: "missing_fields", missing });
  }
  const entry = sanitizeEntry(body);
  const id = db.insertSubmission(entry);
  const published = db.setStatus(id, "approved");
  res.status(201).json({ entry: published });
  syncGit();
});

// ---- public: request an edit (or removal) of an existing entry ----
app.post("/api/edit-requests", (req, res) => {
  const body = req.body || {};
  const email = String(body.email || "").trim();
  const description = String(body.description || "").trim().slice(0, 4000);
  const entryTitle = String(body.entryTitle || "").trim().slice(0, 300) || "(untitled entry)";
  const entryUrl = String(body.entryUrl || "").trim().slice(0, 500);
  if (!description) return res.status(400).json({ error: "missing_description" });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid_email" });

  const payload = { email, description, entryTitle, entryUrl };
  res.status(201).json({ ok: true });
  notifyEditRequest(payload);
  sendEditRequestConfirmation(payload);
});

// ---- public: "here's a repository of case studies, go look" leads ----
app.post("/api/leads", (req, res) => {
  const body = req.body || {};
  const url = String(body.url || "").trim();
  if (!url) return res.status(400).json({ error: "missing_url" });
  const note = String(body.note || "").trim().slice(0, 1000);
  const id = db.insertLead(url.slice(0, 500), note);
  res.status(201).json({ id });
  const adminUrl = `${req.protocol}://${req.get("host")}/admin`;
  notifyNewLead({ url, note }, adminUrl);
});

app.get("/api/admin/leads", requireAuth, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  res.json({ leads: db.getLeads(status) });
});

app.post("/api/admin/leads/:id/done", requireAuth, (req, res) => {
  const lead = db.setLeadStatus(Number(req.params.id), "done");
  if (!lead) return res.status(404).json({ error: "not_found" });
  res.json({ lead });
});

app.delete("/api/admin/leads/:id", requireAuth, (req, res) => {
  db.deleteLead(Number(req.params.id));
  res.json({ ok: true });
});

app.get("/submit", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "submit.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});
app.get("/trends", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "trends.html"));
});
app.get("/reducing-ai-use", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "reducing-ai-use.html"));
});
app.get("/ai-for-research", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "ai-for-research.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "about.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "catalog.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Case study catalog listening on http://localhost:${PORT}`);
});
