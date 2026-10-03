// Presence audit: validate and merge per-document files (see policy/PRESENCE-BRIEF.md).
//   node policy/presence.js validate <dir...>
//   node policy/presence.js merge <dir...> [--out file]     writes data/policy/presence.json
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..", "data", "policy");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
function validateFile(file, { root = ROOT, typesFile } = {}) {
  const errs = [], rows = []; let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { errs: [`${file}: not valid JSON`], rows, unsure: [] }; }
  const id = j.doc_id; const e = (m) => errs.push(`${id || file}: ${m}`);
  if (!id) { e("no doc_id"); return { errs, rows, unsure: [] }; }
  const types = new Set(JSON.parse(fs.readFileSync(typesFile || path.join(root, "run1", "claims", "statement-types.v1.json"), "utf8")).types.map((t) => t.id));
  const sf = path.join(root, "snapshots", id + ".txt"); const snap = fs.existsSync(sf) ? norm(fs.readFileSync(sf, "utf8")) : null; if (snap === null) e("no snapshot");
  if (!j.coder) e("coder is required"); if (!Number.isInteger(j.checked_types) || j.checked_types < 1) e("checked_types must be a positive integer");
  const seen = new Set(), unsure = [];
  for (const f of j.found || []) {
    const k = f.type || "?"; const fe = (m) => e(`${k}: ${m}`);
    if (!types.has(f.type)) fe("type is not in the vocabulary"); else if (seen.has(f.type)) fe("listed twice"); seen.add(f.type);
    if (!f.quote) fe("quote is required"); else { if (words(f.quote) > 60) fe("quote over 60 words"); if (/\.\.\.|…/.test(f.quote)) fe("quote must not stitch passages"); if (snap !== null && !snap.includes(norm(f.quote))) fe("quote is not in the snapshot"); }
    rows.push({ doc_id: id, type: f.type, quote: f.quote, anchor: f.anchor ?? null, coder: j.coder });
  }
  for (const u of j.unsure || []) { if (!types.has(u.type)) e(`unsure ${u.type}: not in the vocabulary`); else if (u.quote && snap !== null && !snap.includes(norm(u.quote))) e(`unsure ${u.type}: quote is not in the snapshot`); unsure.push({ doc_id: id, type: u.type, quote: u.quote ?? null, why: u.why ?? null }); }
  return { errs, rows, unsure };
}
function run(dirs, opts) { const all = { errs: [], rows: [], unsure: [], docs: 0 }; const files = dirs.flatMap((d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => path.join(d, f)) : [d])); for (const f of files) { const r = validateFile(f, opts); all.errs.push(...r.errs); all.rows.push(...r.rows); all.unsure.push(...r.unsure); all.docs++; } return all; }
module.exports = { validateFile, run };
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2); const oi = rest.indexOf("--out"); const out = oi >= 0 ? rest.splice(oi, 2)[1] : path.join(ROOT, "presence.json");
  if (!["validate", "merge"].includes(cmd) || !rest.length) { console.error("usage: node policy/presence.js validate|merge <dir...> [--out file]"); process.exit(2); }
  const r = run(rest); r.errs.forEach((m) => console.log("ERROR " + m)); console.log(`${r.docs} documents, ${r.rows.length} found, ${r.unsure.length} unsure, ${r.errs.length} errors`);
  if (cmd === "merge" && !r.errs.length) { fs.writeFileSync(out, JSON.stringify({ found: r.rows, unsure: r.unsure }, null, 1) + "\n"); console.log("wrote", out); }
  process.exit(r.errs.length ? 1 : 0);
}
