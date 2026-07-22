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
    repo TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL DEFAULT 'submission',
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT
  );
`);

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
    repo: row.repo || "",
    status: row.status,
    source: row.source,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

function seedIfEmpty() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM entries").get();
  if (count > 0) return;

  const seed = require("../data/seed.json");
  const insertRepo = db.prepare(
    "INSERT OR REPLACE INTO repos (key, label, short, url, blurb) VALUES (?, ?, ?, ?, ?)"
  );
  const insertEntry = db.prepare(`
    INSERT INTO entries (t, by_name, inst, u, reg, yr, th, disc, tool, s, repo, status, source, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'seed', ?)
  `);

  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    for (const [key, r] of Object.entries(seed.REPOS)) {
      insertRepo.run(key, r.label || "", r.short || "", r.url || "", r.blurb || "");
    }
    for (const e of seed.S) {
      insertEntry.run(
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
        e.repo || "",
        now
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  console.log(`Seeded ${seed.S.length} curated entries and ${Object.keys(seed.REPOS).length} collections.`);
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

function getSubmissions(status) {
  const rows = status
    ? db.prepare("SELECT * FROM entries WHERE source = 'submission' AND status = ? ORDER BY id DESC").all(status)
    : db.prepare("SELECT * FROM entries WHERE source = 'submission' ORDER BY id DESC").all();
  return rows.map(rowToEntry);
}

function insertSubmission(e) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO entries (t, by_name, inst, u, reg, yr, th, disc, tool, s, repo, status, source, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'community', 'pending', 'submission', ?)
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
    now
  );
  return Number(result.lastInsertRowid);
}

function updateEntry(id, fields) {
  const existing = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
  if (!existing) return null;
  const merged = { ...rowToEntry(existing), ...fields };
  db.prepare(`
    UPDATE entries SET t=?, by_name=?, inst=?, u=?, reg=?, yr=?, th=?, disc=?, tool=?, s=?
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

seedIfEmpty();

module.exports = {
  getApprovedEntries,
  getRepos,
  getSubmissions,
  insertSubmission,
  updateEntry,
  setStatus,
  deleteEntry,
};
