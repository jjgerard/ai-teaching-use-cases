const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "catalog.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS repos (
    key TEXT PRIMARY KEY,
    label TEXT,
    short TEXT,
    url TEXT,
    blurb TEXT
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    t TEXT NOT NULL,
    by_name TEXT,
    inst TEXT,
    u TEXT,
    reg TEXT,
    yr INTEGER,
    th TEXT,
    disc TEXT NOT NULL DEFAULT '[]',
    tool TEXT NOT NULL DEFAULT '[]',
    s TEXT,
    ev TEXT,
    repo TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL DEFAULT 'submission',
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    submitted_at TEXT NOT NULL
  );
`);

// Migration for databases created before the "ev" (evidence) column existed —
// CREATE TABLE IF NOT EXISTS above is a no-op on an existing table, so a
// pre-existing db needs the column added explicitly. Safe to run on every
// boot: fails harmlessly once the column is already there.
try {
  db.exec("ALTER TABLE entries ADD COLUMN ev TEXT");
} catch (err) {
  // already has the column
}

function rowToEntry(row) {
  return {
    id: row.id,
    t: row.t,
    by: row.by_name || "",
    inst: row.inst || "",
    u: row.u || "",
    reg: row.reg || "",
    yr: row.yr || "",
    th: row.th || "",
    disc: JSON.parse(row.disc || "[]"),
    tool: JSON.parse(row.tool || "[]"),
    s: row.s || "",
    ev: row.ev || "",
    repo: row.repo || "",
    status: row.status,
    source: row.source,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

function rowToLead(row) {
  return { id: row.id, url: row.url, note: row.note || "", status: row.status, submittedAt: row.submitted_at };
}

function loadJsonSafe(relPath, fallback) {
  try {
    return require(relPath);
  } catch (err) {
    return fallback;
  }
}

const insertEntryStmt = () =>
  db.prepare(`
    INSERT INTO entries (t, by_name, inst, u, reg, yr, th, disc, tool, s, ev, repo, status, source, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
  `);

function insertApprovedRow(stmt, e, now) {
  stmt.run(
    e.t || "",
    e.by || "",
    e.inst || "",
    e.u || "",
    e.reg || "",
    e.yr || null,
    e.th || "",
    JSON.stringify(e.disc || []),
    JSON.stringify(e.tool || []),
    e.s || "",
    e.ev || "",
    e.repo || "community",
    e.source || "submission",
    now
  );
}

// data/repos metadata (collection labels/urls/blurbs) always comes from the
// curated seed.json — collections themselves aren't edited through the admin
// dashboard, only individual entries are.
function seedRepos() {
  const seed = require("../data/seed.json");
  const insertRepo = db.prepare(
    "INSERT OR REPLACE INTO repos (key, label, short, url, blurb) VALUES (?, ?, ?, ?, ?)"
  );
  for (const [key, r] of Object.entries(seed.REPOS)) {
    insertRepo.run(key, r.label || "", r.short || "", r.url || "", r.blurb || "");
  }
  return seed;
}

// Once anything has ever been approved/edited/deleted via the admin
// dashboard, data/community.json holds a full living snapshot of every
// approved entry — both originally-curated and community-submitted — because
// edits/deletes apply to any entry, not just submitted ones, and that needs
// to survive a from-scratch rebuild the same way new submissions do. Only on
// the very first boot ever (before any admin action has happened) does the
// app fall back to bootstrapping straight from the curated seed.json.
function seedIfEmpty() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM entries").get();
  if (count > 0) return;

  const seed = seedRepos();
  const community = loadJsonSafe("../data/community.json", []);
  const insertEntry = insertEntryStmt();
  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    if (community.length > 0) {
      for (const e of community) insertApprovedRow(insertEntry, e, now);
    } else {
      for (const e of seed.S) insertApprovedRow(insertEntry, { ...e, source: "seed" }, now);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  if (community.length > 0) {
    console.log(`Seeded ${community.length} entries from community.json (full living snapshot).`);
  } else {
    console.log(`Seeded ${seed.S.length} curated entries and ${Object.keys(seed.REPOS).length} collections.`);
  }
}

function getApprovedEntries() {
  const rows = db.prepare("SELECT * FROM entries WHERE status = 'approved' ORDER BY yr DESC, id DESC").all();
  return rows.map(rowToEntry);
}

function getRepos() {
  const rows = db.prepare("SELECT * FROM repos").all();
  const out = {};
  for (const r of rows) out[r.key] = { label: r.label, short: r.short, url: r.url, blurb: r.blurb };
  out.community = {
    label: "Community submissions — reviewed and approved",
    short: "Community",
    url: "",
    blurb: "Submitted through this catalog's public form and approved by the maintainer.",
  };
  return out;
}

// Every entry regardless of source (seed or submission) — the admin
// dashboard needs to see and manage all of it, not just community
// submissions.
function getAllEntries(status) {
  const rows = status
    ? db.prepare("SELECT * FROM entries WHERE status = ? ORDER BY id DESC").all(status)
    : db.prepare("SELECT * FROM entries ORDER BY id DESC").all();
  return rows.map(rowToEntry);
}

function insertSubmission(e) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO entries (t, by_name, inst, u, reg, yr, th, disc, tool, s, ev, repo, status, source, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'community', 'pending', 'submission', ?)
  `);
  const result = stmt.run(
    e.t || "",
    e.by || "",
    e.inst || "",
    e.u || "",
    e.reg || "",
    e.yr || null,
    e.th || "",
    JSON.stringify(e.disc || []),
    JSON.stringify(e.tool || []),
    e.s || "",
    e.ev || "",
    now
  );
  return Number(result.lastInsertRowid);
}

function updateEntry(id, fields) {
  const existing = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
  if (!existing) return null;
  const merged = { ...rowToEntry(existing), ...fields };
  db.prepare(`
    UPDATE entries SET t=?, by_name=?, inst=?, u=?, reg=?, yr=?, th=?, disc=?, tool=?, s=?, ev=?
    WHERE id=?
  `).run(
    merged.t || "",
    merged.by || "",
    merged.inst || "",
    merged.u || "",
    merged.reg || "",
    merged.yr || null,
    merged.th || "",
    JSON.stringify(merged.disc || []),
    JSON.stringify(merged.tool || []),
    merged.s || "",
    merged.ev || "",
    id
  );
  return rowToEntry(db.prepare("SELECT * FROM entries WHERE id = ?").get(id));
}

function setStatus(id, status) {
  const now = new Date().toISOString();
  db.prepare("UPDATE entries SET status = ?, reviewed_at = ? WHERE id = ?").run(status, now, id);
  const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
  return row ? rowToEntry(row) : null;
}

function deleteEntry(id) {
  db.prepare("DELETE FROM entries WHERE id = ?").run(id);
}

// Plain-schema export of every currently-approved entry, regardless of
// source — this is the full snapshot committed to data/community.json.
// Includes repo/source so originally-curated entries keep their real
// collection attribution (and provenance) when reloaded on a fresh boot,
// rather than being folded into "community".
function getAllApprovedEntriesForExport() {
  const rows = db.prepare("SELECT * FROM entries WHERE status = 'approved' ORDER BY id ASC").all();
  return rows.map(rowToEntry).map((e) => ({
    t: e.t,
    by: e.by,
    inst: e.inst,
    u: e.u,
    reg: e.reg,
    yr: e.yr,
    th: e.th,
    disc: e.disc,
    tool: e.tool,
    s: e.s,
    ev: e.ev,
    repo: e.repo,
    source: e.source,
  }));
}

// ---- leads: "here's a whole repository of case studies, go look" ----
// Lightweight and not git-persisted like entries are — these are a
// maintainer to-do list, not part of the public catalog, and (like pending
// submissions) are backed up by the notification email if the database
// doesn't survive until they're processed.
function insertLead(url, note) {
  const now = new Date().toISOString();
  const result = db
    .prepare("INSERT INTO leads (url, note, status, submitted_at) VALUES (?, ?, 'new', ?)")
    .run(url, note || "", now);
  return Number(result.lastInsertRowid);
}

function getLeads(status) {
  const rows = status
    ? db.prepare("SELECT * FROM leads WHERE status = ? ORDER BY id DESC").all(status)
    : db.prepare("SELECT * FROM leads ORDER BY id DESC").all();
  return rows.map(rowToLead);
}

function setLeadStatus(id, status) {
  db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return row ? rowToLead(row) : null;
}

function deleteLead(id) {
  db.prepare("DELETE FROM leads WHERE id = ?").run(id);
}

seedIfEmpty();

module.exports = {
  getApprovedEntries,
  getRepos,
  getAllEntries,
  insertSubmission,
  updateEntry,
  setStatus,
  deleteEntry,
  getAllApprovedEntriesForExport,
  insertLead,
  getLeads,
  setLeadStatus,
  deleteLead,
};
